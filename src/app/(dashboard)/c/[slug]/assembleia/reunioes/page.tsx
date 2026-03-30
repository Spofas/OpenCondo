import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { MeetingPageClient } from "./meeting-page-client";

function MeetingsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-9 w-36 rounded-lg bg-muted" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-5 w-20 rounded-full bg-muted" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-48 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

async function MeetingsContent({
  condoId,
  isAdmin,
}: {
  condoId: string;
  isAdmin: boolean;
}) {
  const [meetings, units, memberships] = await Promise.all([
    db.meeting.findMany({
      where: { condominiumId: condoId },
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
      where: { condominiumId: condoId },
      include: { owner: { select: { name: true } } },
      orderBy: { identifier: "asc" },
    }),
    db.membership.findMany({
      where: { condominiumId: condoId, isActive: true },
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
      isAdmin={isAdmin}
    />
  );
}

export default async function MeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  return (
    <Suspense fallback={<MeetingsSkeleton />}>
      <MeetingsContent
        condoId={membership.condominiumId}
        isAdmin={membership.role === "ADMIN"}
      />
    </Suspense>
  );
}
