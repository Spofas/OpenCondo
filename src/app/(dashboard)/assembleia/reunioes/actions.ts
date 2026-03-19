"use server";

import { db } from "@/lib/db";
import {
  meetingSchema,
  attendanceSchema,
  voteSchema,
  ataSchema,
  type MeetingInput,
  type AttendanceInput,
  type VoteInput,
  type AtaInput,
} from "@/lib/validators/meeting";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/admin-context";

export async function createMeeting(input: MeetingInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = meetingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, time, location, type, agendaItems } = parsed.data;
  const dateTime = new Date(`${date}T${time}`);

  await db.meeting.create({
    data: {
      condominiumId: ctx.condominiumId,
      date: dateTime,
      location,
      type: type as "ORDINARIA" | "EXTRAORDINARIA",
      agendaItems: {
        create: agendaItems.map((item, index) => ({
          order: index + 1,
          title: item.title,
          description: item.description || null,
        })),
      },
    },
  });

  revalidatePath("/assembleia/reunioes");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateMeetingStatus(meetingId: string, status: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, condominiumId: ctx.condominiumId },
  });

  if (!meeting) return { error: "Assembleia não encontrada" };

  await db.meeting.update({
    where: { id: meetingId },
    data: { status: status as "AGENDADA" | "REALIZADA" | "CANCELADA" },
  });

  revalidatePath("/assembleia/reunioes");
  revalidatePath("/painel");
  return { success: true };
}

export async function saveAttendance(meetingId: string, input: AttendanceInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = attendanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, condominiumId: ctx.condominiumId },
  });

  if (!meeting) return { error: "Assembleia não encontrada" };

  // Get units to look up permilagem for each attendee
  const units = await db.unit.findMany({
    where: { condominiumId: ctx.condominiumId },
    select: { ownerId: true, permilagem: true },
  });

  const permilagemByOwner = new Map<string, number>();
  for (const unit of units) {
    if (unit.ownerId) {
      const current = permilagemByOwner.get(unit.ownerId) || 0;
      permilagemByOwner.set(unit.ownerId, current + unit.permilagem);
    }
  }

  await Promise.all(
    parsed.data.attendees.map((attendee) =>
      db.meetingAttendee.upsert({
        where: {
          meetingId_userId: {
            meetingId,
            userId: attendee.userId,
          },
        },
        update: {
          status: attendee.status as "PRESENTE" | "REPRESENTADO" | "AUSENTE",
          representedBy: attendee.representedBy || null,
          permilagem: permilagemByOwner.get(attendee.userId) || 0,
        },
        create: {
          meetingId,
          userId: attendee.userId,
          status: attendee.status as "PRESENTE" | "REPRESENTADO" | "AUSENTE",
          representedBy: attendee.representedBy || null,
          permilagem: permilagemByOwner.get(attendee.userId) || 0,
        },
      })
    )
  );

  revalidatePath("/assembleia/reunioes");
  return { success: true };
}

export async function recordVotes(meetingId: string, input: VoteInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = voteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, condominiumId: ctx.condominiumId },
  });

  if (!meeting) return { error: "Assembleia não encontrada" };

  // Get unit permilagem values
  const units = await db.unit.findMany({
    where: { condominiumId: ctx.condominiumId },
    select: { id: true, permilagem: true },
  });

  const permilagemByUnit = new Map<string, number>();
  for (const unit of units) {
    permilagemByUnit.set(unit.id, unit.permilagem);
  }

  await Promise.all(
    parsed.data.votes.map((vote) =>
      db.vote.upsert({
        where: {
          meetingId_agendaItemId_unitId: {
            meetingId,
            agendaItemId: parsed.data.agendaItemId,
            unitId: vote.unitId,
          },
        },
        update: {
          vote: vote.vote as "A_FAVOR" | "CONTRA" | "ABSTENCAO",
          permilagem: permilagemByUnit.get(vote.unitId) || 0,
        },
        create: {
          meetingId,
          agendaItemId: parsed.data.agendaItemId,
          unitId: vote.unitId,
          vote: vote.vote as "A_FAVOR" | "CONTRA" | "ABSTENCAO",
          permilagem: permilagemByUnit.get(vote.unitId) || 0,
        },
      })
    )
  );

  revalidatePath("/assembleia/reunioes");
  return { success: true };
}

export async function saveAta(meetingId: string, input: AtaInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = ataSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, condominiumId: ctx.condominiumId },
  });

  if (!meeting) return { error: "Assembleia não encontrada" };

  // Count existing atas for numbering
  const ataCount = await db.ata.count({
    where: { meeting: { condominiumId: ctx.condominiumId } },
  });

  await db.ata.upsert({
    where: { meetingId },
    update: { content: parsed.data.content },
    create: {
      meetingId,
      number: ataCount + 1,
      content: parsed.data.content,
    },
  });

  revalidatePath("/assembleia/reunioes");
  revalidatePath("/assembleia/atas");
  return { success: true };
}

export async function deleteMeeting(meetingId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const meeting = await db.meeting.findFirst({
    where: { id: meetingId, condominiumId: ctx.condominiumId },
  });

  if (!meeting) return { error: "Assembleia não encontrada" };

  await db.meeting.delete({ where: { id: meetingId } });

  revalidatePath("/assembleia/reunioes");
  revalidatePath("/assembleia/atas");
  revalidatePath("/painel");
  return { success: true };
}
