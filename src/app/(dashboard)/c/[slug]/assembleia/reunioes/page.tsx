import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { MeetingPageClient } from "./meeting-page-client";

export default async function MeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  const [meetings, units, memberships] = await Promise.all([
    db.meeting.findMany({
      where: { condominiumId: membership.condominiumId },
      include: {
        agendaItems: { orderBy: { order: "asc" } },
        attendees: {
          include: { user: { select: { name: true } } },
        },
        votes: {
          include: { unit: { select: { identifier: true } } },
        },
        ata: true,
      },
      orderBy: { date: "desc" },
    }),
    db.unit.findMany({
      where: { condominiumId: membership.condominiumId },
      include: { owner: { select: { name: true } } },
      orderBy: { identifier: "asc" },
    }),
    db.membership.findMany({
      where: { condominiumId: membership.condominiumId, isActive: true },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const serializedMeetings = meetings.map((m) => ({
    id: m.id,
    date: m.date.toISOString(),
    location: m.location,
    type: m.type,
    status: m.status,
    agendaItems: m.agendaItems.map((a) => ({
      id: a.id,
      order: a.order,
      title: a.title,
      description: a.description,
    })),
    attendees: m.attendees.map((a) => ({
      userId: a.userId,
      userName: a.user.name,
      status: a.status,
      permilagem: a.permilagem,
      representedBy: a.representedBy,
    })),
    votes: m.votes.map((v) => ({
      agendaItemId: v.agendaItemId,
      unitId: v.unitId,
      unitIdentifier: v.unit.identifier,
      vote: v.vote,
      permilagem: v.permilagem,
    })),
    hasAta: !!m.ata,
    ataContent: m.ata?.content || null,
  }));

  const serializedUnits = units.map((u) => ({
    id: u.id,
    identifier: u.identifier,
    permilagem: u.permilagem,
    ownerName: u.owner?.name || null,
  }));

  const serializedMembers = memberships.map((m) => ({
    userId: m.user.id,
    userName: m.user.name,
  }));

  return (
    <MeetingPageClient
      meetings={serializedMeetings}
      units={serializedUnits}
      members={serializedMembers}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
