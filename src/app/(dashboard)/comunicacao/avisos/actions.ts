"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announcementSchema, type AnnouncementInput } from "@/lib/validators/announcement";
import { revalidatePath } from "next/cache";

async function getAdminContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  const membership = condominiumId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId,
          },
        },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!membership || membership.role !== "ADMIN") return null;

  return { userId: session.user.id, condominiumId: membership.condominiumId };
}

export async function createAnnouncement(input: AnnouncementInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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
}

export async function updateAnnouncement(announcementId: string, input: AnnouncementInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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
}

export async function deleteAnnouncement(announcementId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, condominiumId: ctx.condominiumId },
  });

  if (!announcement) return { error: "Aviso não encontrado" };

  await db.announcement.delete({ where: { id: announcementId } });

  revalidatePath("/comunicacao/avisos");
  revalidatePath("/painel");
  return { success: true };
}

export async function togglePin(announcementId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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
}
