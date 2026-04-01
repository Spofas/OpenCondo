import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { AtasPageClient } from "./atas-page-client";

const ITEMS_PER_PAGE = 20;

export default async function AtasPage({
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

  const condoId = membership.condominiumId;

  const [atas, totalAtas] = await Promise.all([
    db.ata.findMany({
      where: { meeting: { condominiumId: condoId } },
      include: {
        meeting: { select: { date: true, type: true, location: true } },
      },
      orderBy: { number: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.ata.count({
      where: { meeting: { condominiumId: condoId } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalAtas / ITEMS_PER_PAGE));

  const serializedAtas = atas.map((ata) => ({
    id: ata.id,
    number: ata.number,
    status: ata.status,
    content: ata.content,
    meetingDate: ata.meeting.date.toISOString(),
    meetingType: ata.meeting.type,
    meetingLocation: ata.meeting.location,
  }));

  return (
    <AtasPageClient
      atas={serializedAtas}
      page={page}
      totalPages={totalPages}
      totalAtas={totalAtas}
    />
  );
}
