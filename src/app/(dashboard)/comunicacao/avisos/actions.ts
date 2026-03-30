"use server";

import { db } from "@/lib/db";
import { announcementSchema, type AnnouncementInput } from "@/lib/validators/announcement";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

export const createAnnouncement = withAdmin(async (ctx, input: AnnouncementInput) => {
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, body, category, pinned } = parsed.data;

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

  revalidatePath("/comunicacao/avisos");
  revalidatePath("/painel");
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

  revalidatePath("/comunicacao/avisos");
  return { success: true };
});

export const deleteAnnouncement = withAdmin(async (ctx, announcementId: string) => {
  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, condominiumId: ctx.condominiumId },
  });

  if (!announcement) return { error: "Aviso não encontrado" };

  await db.announcement.delete({ where: { id: announcementId } });

  revalidatePath("/comunicacao/avisos");
  revalidatePath("/painel");
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

  revalidatePath("/comunicacao/avisos");
  return { success: true };
});
