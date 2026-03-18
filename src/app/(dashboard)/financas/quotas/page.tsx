import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuotaPageClient } from "./quota-page-client";

export default async function QuotasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cookieStore = await cookies();
  const selectedCondoId = cookieStore.get("activeCondominiumId")?.value;

  const membership = selectedCondoId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId: selectedCondoId,
          },
        },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!membership) redirect("/iniciar");

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

  // Fetch all quotas with unit info
  const quotas = await db.quota.findMany({
    where: { condominiumId: membership.condominiumId },
    include: { unit: { select: { id: true, identifier: true, permilagem: true } } },
    orderBy: [{ period: "desc" }, { unit: { identifier: "asc" } }],
  });

  // Fetch units for the generation form
  const units = await db.unit.findMany({
    where: { condominiumId: membership.condominiumId },
    orderBy: { identifier: "asc" },
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

  return (
    <QuotaPageClient
      quotas={serializedQuotas}
      units={units}
      defaultSplitMethod={condominium?.quotaModel ?? "PERMILAGEM"}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
