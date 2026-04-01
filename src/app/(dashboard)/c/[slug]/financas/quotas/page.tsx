import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeQuota } from "@/lib/serializers";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { QuotaPageClient } from "./quota-page-client";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}

function QuotasSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-9 w-20 rounded-lg bg-muted" />
        <div className="h-9 w-20 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function QuotasContent({
  condoId,
  userId,
  isAdmin,
  selectedYear,
  slug,
}: {
  condoId: string;
  userId: string;
  isAdmin: boolean;
  selectedYear: number;
  slug: string;
}) {
  // Overdue marking removed — handled by nightly cron job (api/cron/process)
  const now = new Date();

  // Non-admin: only show quotas for units they own/rent
  let unitIdFilter: { in: string[] } | undefined;
  if (!isAdmin) {
    const ownUnits = await db.unit.findMany({
      where: {
        condominiumId: condoId,
        OR: [{ ownerId: userId }, { tenantId: userId }],
      },
      select: { id: true },
    });
    unitIdFilter = { in: ownUnits.map((u) => u.id) };
  }

  // Fetch only the selected year's quotas — avoids loading all history on every render
  const baseWhere = {
    condominiumId: condoId,
    period: { startsWith: `${selectedYear}-` },

    ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
  };

  // Available years (lightweight: only reads period column with distinct)
  const allPeriods = await db.quota.findMany({
    where: {
      condominiumId: condoId,
  
      ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
    },
    select: { period: true },
    distinct: ["period"],
    orderBy: { period: "asc" },
  });
  const availableYears = [...new Set(allPeriods.map((p) => p.period.slice(0, 4)))]
    .sort()
    .reverse();

  const quotas = await db.quota.findMany({
    where: baseWhere,
    include: { unit: { select: { id: true, identifier: true, permilagem: true } } },
    orderBy: [{ period: "asc" }, { unit: { floor: "asc" } }, { unit: { identifier: "asc" } }],
  });

  // Fetch units for the generation form (admin only)
  const units = await db.unit.findMany({
    where: { condominiumId: condoId },
    orderBy: [{ floor: "asc" }, { identifier: "asc" }],
    select: { id: true, identifier: true, permilagem: true },
  });

  // Fetch condominium for quota model
  const condominium = await db.condominium.findUnique({
    where: { id: condoId },
    select: { quotaModel: true },
  });

  const serializedQuotas = quotas.map(serializeQuota);

  // Build debtor summary for admin (always uses all unpaid quotas, not year-scoped)
  let debtorSummary = null;
  if (isAdmin) {
    const unpaidQuotas = await db.quota.findMany({
      where: {
        condominiumId: condoId,
        status: { in: ["PENDING", "OVERDUE"] },
    
      },
      include: {
        unit: {
          select: {
            id: true,
            identifier: true,
            floor: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const quotasForCalc = unpaidQuotas.map((q) => ({
      unitId: q.unit.id,
      unitIdentifier: q.unit.identifier,
      unitFloor: q.unit.floor,
      ownerName: q.unit.owner?.name ?? null,
      ownerEmail: q.unit.owner?.email ?? null,
      amount: Number(q.amount),
      dueDate: q.dueDate.toISOString().slice(0, 10),
      status: q.status as "PENDING" | "OVERDUE",
    }));

    debtorSummary = buildDebtorSummary(quotasForCalc, now);
  }

  return (
    <QuotaPageClient
      quotas={serializedQuotas}
      units={units}
      defaultSplitMethod={condominium?.quotaModel ?? "PERMILAGEM"}
      isAdmin={isAdmin}
      debtorSummary={debtorSummary}
      availableYears={availableYears}
      selectedYear={String(selectedYear)}
    />
  );
}

export default async function QuotasPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { session, membership } = await requireMembership(slug);

  const isAdmin = membership.role === "ADMIN";
  const now = new Date();

  // Resolve selected year from URL (default: current year)
  const searchP = await searchParams;
  const selectedYear = parseInt(searchP.year ?? String(now.getFullYear()), 10);

  return (
    <Suspense fallback={<QuotasSkeleton />}>
      <QuotasContent
        condoId={membership.condominiumId}
        userId={session.user.id!}
        isAdmin={isAdmin}
        selectedYear={selectedYear}
        slug={slug}
      />
    </Suspense>
  );
}
