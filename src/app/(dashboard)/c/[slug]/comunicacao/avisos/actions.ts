"use server";

import { db } from "@/lib/db";
import { announcementSchema, type AnnouncementInput } from "@/lib/validators/announcement";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";
import { sendAnnouncementNotification } from "@/lib/email";

export const createAnnouncement = withAdmin(async (ctx, input: AnnouncementInput) => {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, body, category, pinned } = parsed.data;

  const condo = await db.condominium.findUnique({
    where: { id: ctx.condominiumId },
    select: { name: true },
  });

  await db.announcement.create({
    data: {
      condominiumId: ctx.condominiumId,
      authorId: ctx.userId,
      title,
      body,
      category: category as "GERAL" | "OBRAS" | "MANUTENCAO" | "ASSEMBLEIA" | "URGENTE",
      pinned: pinned || false,
    },
  });

  const author = await db.user.findUnique({
    where: { id: ctx.userId },
    select: { name: true },
  });

  // Send email notifications (fire-and-forget)
  sendAnnouncementNotification(
    ctx.condominiumId,
    condo?.name ?? "",
    author?.name ?? "",
    title,
    category,
    ctx.userId
  ).catch(() => {});

  revalidatePath("/c/");
  return { success: true };
});

export const updateAnnouncement = withAdmin(async (ctx, announcementId: string, input: AnnouncementInput) => {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, condominiumId: ctx.condominiumId },
  });

  if (!announcement) return { error: "Aviso não encontrado" };

  const { title, body, category, pinned } = parsed.data;

  await db.announcement.update({
    where: { id: announcementId },
    data: {
      title,
      body,
      category: category as "GERAL" | "OBRAS" | "MANUTENCAO" | "ASSEMBLEIA" | "URGENTE",
      pinned: pinned || false,
    },
  });

  revalidatePath("/c/");
  return { success: true };
});

export const deleteAnnouncement = withAdmin(async (ctx, announcementId: string) => {
  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, condominiumId: ctx.condominiumId },
  });

  if (!announcement) return { error: "Aviso não encontrado" };

  await db.announcement.delete({ where: { id: announcementId } });

  revalidatePath("/c/");
  return { success: true };
});

export const togglePin = withAdmin(async (ctx, announcementId: string) => {
  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, condominiumId: ctx.condominiumId },
  });

  if (!announcement) return { error: "Aviso não encontrado" };

  await db.announcement.update({
    where: { id: announcementId },
    data: { pinned: !announcement.pinned },
  });

  revalidatePath("/c/");
  return { success: true };
});
