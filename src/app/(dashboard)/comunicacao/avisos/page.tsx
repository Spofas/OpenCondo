import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnouncementPageClient } from "./announcement-page-client";

export default async function AnnouncementsPage() {
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
