import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { buildDebtorSummary } from "@/lib/debtor-calculations";
import { QuotaPageClient } from "./quota-page-client";

export default async function QuotasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const isAdmin = membership.role === "ADMIN";

  // Mark overdue quotas before fetching
  const now = new Date();
  await db.quota.updateMany({
    where: {
      condominiumId: membership.condominiumId,
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

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

  // Fetch quotas (filtered for non-admin)
  const quotas = await db.quota.findMany({
    where: {
      condominiumId: membership.condominiumId,
      ...(unitIdFilter ? { unitId: unitIdFilter } : {}),
    },
    include: { unit: { select: { id: true, identifier: true, permilagem: true } } },
    orderBy: [{ period: "desc" }, { unit: { floor: "asc" } }, { unit: { identifier: "asc" } }],
  });

  // Fetch units for the generation form (admin only; non-admin doesn't see the form)
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

  const serializedQuotas = quotas.map((q) => ({
    id: q.id,
    unitId: q.unitId,
    unitIdentifier: q.unit.identifier,
    unitPermilagem: q.unit.permilagem,
    period: q.period,
    amount: Number(q.amount),
    dueDate: q.dueDate.toISOString(),
    status: q.status as "PENDING" | "PAID" | "OVERDUE",
    paymentDate: q.paymentDate?.toISOString() ?? null,
    paymentMethod: q.paymentMethod,
    paymentNotes: q.paymentNotes,
  }));

  // Build debtor summary for admin
  let debtorSummary = null;
  if (isAdmin) {
    const unpaidQuotas = await db.quota.findMany({
      where: {
        condominiumId: membership.condominiumId,
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
    />
  );
}
