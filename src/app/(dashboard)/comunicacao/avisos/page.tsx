import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { AnnouncementPageClient } from "./announcement-page-client";

export default async function AnnouncementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

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
