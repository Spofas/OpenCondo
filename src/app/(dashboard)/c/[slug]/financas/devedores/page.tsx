import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { DebtorClient } from "./debtor-client";

function DevedoresSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-40 rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <div className="h-4 w-32 rounded bg-muted mb-1" />
                <div className="h-3 w-24 rounded bg-muted" />
              </div>
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function DevedoresContent({ condoId }: { condoId: string }) {
  // Mark overdue quotas before calculating
  const now = new Date();
  await db.quota.updateMany({
    where: {
      condominiumId: condoId,
      status: "PENDING",
      dueDate: { lt: now },
      deletedAt: null,
    },
    data: { status: "OVERDUE" },
  });

  const unpaidQuotas = await db.quota.findMany({
    where: {
      condominiumId: condoId,
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

  const summary = buildDebtorSummary(quotasForCalc, now);

  return <DebtorClient summary={summary} />;
}

export default async function DebtorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  // Admin-only page
  if (membership.role !== "ADMIN") {
    redirect(`/c/${slug}/painel`);
  }

  return (
    <Suspense fallback={<DevedoresSkeleton />}>
      <DevedoresContent condoId={membership.condominiumId} />
    </Suspense>
  );
}
