import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { MaintenancePageClient } from "./maintenance-page-client";

export default async function MaintenancePage() {
  const { membership } = await requireMembership();

  const requests = await db.maintenanceRequest.findMany({
    where: { condominiumId: membership.condominiumId },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      priority: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      requester: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedRequests = requests.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    location: r.location,
    priority: r.priority,
    status: r.status,
    requesterName: r.requester.name,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <MaintenancePageClient
      requests={serializedRequests}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
