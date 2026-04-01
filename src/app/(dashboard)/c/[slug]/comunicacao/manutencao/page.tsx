import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { MaintenancePageClient } from "./maintenance-page-client";

const ITEMS_PER_PAGE = 20;

export default async function MaintenancePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  const searchP = await searchParams;
  const page = Math.max(1, parseInt(searchP.page ?? "1", 10));

  const where = { condominiumId: membership.condominiumId };

  const [requests, totalRequests] = await Promise.all([
    db.maintenanceRequest.findMany({
      where,
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
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.maintenanceRequest.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalRequests / ITEMS_PER_PAGE));

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
      page={page}
      totalPages={totalPages}
      totalRequests={totalRequests}
    />
  );
}
