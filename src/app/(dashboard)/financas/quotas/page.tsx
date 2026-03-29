import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeQuota } from "@/lib/serializers";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { QuotaPageClient } from "./quota-page-client";

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function QuotasPage({ searchParams }: PageProps) {
  const { session, membership } = await requireMembership();

  const isAdmin = membership.role === "ADMIN";

  // Mark overdue quotas before fetching
  const now = new Date();
  await db.quota.updateMany({
    where: {
      condominiumId: membership.condominiumId,
      status: "PENDING",
      dueDate: { lt: now },
      deletedAt: null,
    },
    data: { status: "OVERDUE" },
  });

  // Resolve selected year from URL (default: current year)
  const params = await searchParams;
  const selectedYear = parseInt(params.year ?? String(now.getFullYear()), 10);

  // Non-admin: only show quotas for units they own/rent
  let unitIdFilter: { in: string[] } | undefined;
  if (!isAdmin) {
    const ownUnits = await db.unit.findMany({
      where: {
        condominiumId: membership.condominiumId,
        OR: [{ ownerId: session.user.id }, { tenantId: session.user.id }],
      },
      select: { id: true },
    });
    unitIdFilter = { in: ownUnits.map((u) => u.id) };
  }

  // Fetch only the selected year's quotas — avoids loading all history on every render
  const baseWhere = {
    condominiumId: membership.condominiumId,
    period: { startsWith: `${selectedYear}-` },
    deletedAt: null,
    ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
  };

  // Available years (lightweight: only reads period column with distinct)
  const allPeriods = await db.quota.findMany({
    where: {
      condominiumId: membership.condominiumId,
      deletedAt: null,
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
    where: { condominiumId: membership.condominiumId },
    orderBy: [{ floor: "asc" }, { identifier: "asc" }],
    select: { id: true, identifier: true, permilagem: true },
  });

  // Fetch condominium for quota model
  const condominium = await db.condominium.findUnique({
    where: { id: membership.condominiumId },
    select: { quotaModel: true },
  });

  const serializedQuotas = quotas.map(serializeQuota);

  // Build debtor summary for admin (always uses all unpaid quotas, not year-scoped)
  let debtorSummary = null;
  if (isAdmin) {
    const unpaidQuotas = await db.quota.findMany({
      where: {
        condominiumId: membership.condominiumId,
        status: { in: ["PENDING", "OVERDUE"] },
        deletedAt: null,
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
