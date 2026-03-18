import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MaintenancePageClient } from "./maintenance-page-client";

export default async function MaintenancePage() {
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
