import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { DebtorClient } from "./debtor-client";

export default async function DebtorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");
  if (membership.role !== "ADMIN") redirect("/painel");

  const condoId = membership.condominiumId;
  const now = new Date();

  // Fetch all unpaid quotas with unit and owner info
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

  const summary = buildDebtorSummary(quotasForCalc, now);

  return <DebtorClient summary={summary} />;
}
