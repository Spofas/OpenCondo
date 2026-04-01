import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { AnnouncementPageClient } from "./announcement-page-client";

const ITEMS_PER_PAGE = 20;

export default async function AnnouncementsPage({
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

  const [announcements, totalAnnouncements, totalMembers] = await Promise.all([
    db.announcement.findMany({
      where: { condominiumId: membership.condominiumId },
      include: {
        author: { select: { name: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.announcement.count({
      where: { condominiumId: membership.condominiumId },
    }),
    db.membership.count({
      where: { condominiumId: membership.condominiumId, isActive: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalAnnouncements / ITEMS_PER_PAGE));

  const serializedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body.length > 200 ? a.body.slice(0, 200) + "…" : a.body,
    category: a.category,
    pinned: a.pinned,
    authorName: a.author.name,
    createdAt: a.createdAt.toISOString(),
    readCount: a._count.reads,
  }));

  return (
    <AnnouncementPageClient
      announcements={serializedAnnouncements}
      isAdmin={membership.role === "ADMIN"}
      totalMembers={totalMembers}
      page={page}
      totalPages={totalPages}
      totalAnnouncements={totalAnnouncements}
    />
  );
}
