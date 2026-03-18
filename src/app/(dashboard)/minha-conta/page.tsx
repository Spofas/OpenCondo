import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MyAccountClient } from "./my-account-client";

export default async function MyAccountPage() {
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
        include: { condominium: true },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: { condominium: true },
      });

  if (!membership) redirect("/iniciar");

  const condoId = membership.condominiumId;

  // Get units owned or rented by this user
  const [ownedUnits, rentedUnits] = await Promise.all([
    db.unit.findMany({
      where: { condominiumId: condoId, ownerId: session.user.id },
      orderBy: { identifier: "asc" },
    }),
    db.unit.findMany({
      where: { condominiumId: condoId, tenantId: session.user.id },
      orderBy: { identifier: "asc" },
    }),
  ]);

  const allUnitIds = [...ownedUnits, ...rentedUnits].map((u) => u.id);

  // Mark overdue
  const now = new Date();
  await db.quota.updateMany({
    where: {
      condominiumId: condoId,
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  // Fetch quotas for user's units
  const quotas = allUnitIds.length > 0
    ? await db.quota.findMany({
        where: { unitId: { in: allUnitIds } },
        include: { unit: { select: { identifier: true } } },
        orderBy: [{ period: "desc" }, { unit: { identifier: "asc" } }],
      })
    : [];

  // Summary calculations
  const pendingAmount = quotas
    .filter((q) => q.status === "PENDING")
    .reduce((sum, q) => sum + Number(q.amount), 0);
  const overdueAmount = quotas
    .filter((q) => q.status === "OVERDUE")
    .reduce((sum, q) => sum + Number(q.amount), 0);
  const paidAmount = quotas
    .filter((q) => q.status === "PAID")
    .reduce((sum, q) => sum + Number(q.amount), 0);

  const serializedQuotas = quotas.map((q) => ({
    id: q.id,
    unitIdentifier: q.unit.identifier,
    period: q.period,
    amount: Number(q.amount),
    dueDate: q.dueDate.toISOString(),
    status: q.status as "PENDING" | "PAID" | "OVERDUE",
    paymentDate: q.paymentDate?.toISOString() || null,
    paymentMethod: q.paymentMethod,
  }));

  const serializedUnits = [...ownedUnits, ...rentedUnits].map((u) => ({
    id: u.id,
    identifier: u.identifier,
    floor: u.floor,
    typology: u.typology,
    permilagem: u.permilagem,
    isOwner: ownedUnits.some((ou) => ou.id === u.id),
  }));

  return (
    <MyAccountClient
      userName={session.user.name || ""}
      userEmail={session.user.email || ""}
      condominiumName={membership.condominium.name}
      role={membership.role}
      units={serializedUnits}
      quotas={serializedQuotas}
      summary={{ pendingAmount, overdueAmount, paidAmount }}
    />
  );
}
