import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { AnnouncementPageClient } from "./announcement-page-client";

export default async function AnnouncementsPage() {
  const { membership } = await requireMembership();

  const [announcements, totalMembers] = await Promise.all([
    db.announcement.findMany({
      where: { condominiumId: membership.condominiumId },
      include: {
        author: { select: { name: true } },
        _count: { select: { reads: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.membership.count({
      where: { condominiumId: membership.condominiumId, isActive: true },
    }),
  ]);

  const serializedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
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
    />
  );
}
