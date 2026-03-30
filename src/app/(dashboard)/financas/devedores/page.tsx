import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { DebtorClient } from "./debtor-client";

export default async function DebtorPage() {
  const { membership } = await requireMembership();

  // Admin-only page
  if (membership.role !== "ADMIN") {
    redirect("/painel");
  }

  // Mark overdue quotas before calculating
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

  const summary = buildDebtorSummary(quotasForCalc, now);

  return <DebtorClient summary={summary} />;
}
