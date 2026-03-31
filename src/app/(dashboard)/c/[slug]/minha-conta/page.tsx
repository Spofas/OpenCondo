import { db } from "@/lib/db";
import { requireMembershipWithCondo } from "@/lib/auth/require-membership";
import { MyAccountClient } from "./my-account-client";
import { NotificationPreferences } from "../definicoes/notification-preferences";
import { NOTIFICATION_DEFAULTS } from "@/lib/validators/notification-preferences";

export default async function MyAccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { session, membership } = await requireMembershipWithCondo(slug);

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

  // Get notification preferences
  const notifPref = await db.notificationPreference.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: condoId,
      },
    },
  });
  const notificationPreferences = notifPref
    ? {
        quotas: notifPref.quotas,
        announcements: notifPref.announcements,
        meetings: notifPref.meetings,
        maintenance: notifPref.maintenance,
        contracts: notifPref.contracts,
      }
    : { ...NOTIFICATION_DEFAULTS };

  const serializedUnits = [...ownedUnits, ...rentedUnits].map((u) => ({
    id: u.id,
    identifier: u.identifier,
    floor: u.floor,
    typology: u.typology,
    permilagem: u.permilagem,
    isOwner: ownedUnits.some((ou) => ou.id === u.id),
  }));

  return (
    <div className="space-y-6">
      <MyAccountClient
        userName={session.user.name || ""}
        userEmail={session.user.email || ""}
        condominiumName={membership.condominium.name}
        role={membership.role}
        units={serializedUnits}
        quotas={serializedQuotas}
        summary={{ pendingAmount, overdueAmount, paidAmount }}
      />
      <NotificationPreferences preferences={notificationPreferences} />
    </div>
  );
}
