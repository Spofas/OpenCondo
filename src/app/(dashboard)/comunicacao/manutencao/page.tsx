import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { MaintenancePageClient } from "./maintenance-page-client";

export default async function MaintenancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const requests = await db.maintenanceRequest.findMany({
    where: { condominiumId: membership.condominiumId },
    include: {
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
