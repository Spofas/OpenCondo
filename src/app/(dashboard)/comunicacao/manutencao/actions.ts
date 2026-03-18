"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  maintenanceSchema,
  maintenanceUpdateSchema,
  type MaintenanceInput,
  type MaintenanceUpdateInput,
} from "@/lib/validators/maintenance";
import { revalidatePath } from "next/cache";

async function getAuthContext() {
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

  if (!membership) return null;

  return {
    userId: session.user.id,
    condominiumId: membership.condominiumId,
    role: membership.role,
  };
}

export async function createMaintenanceRequest(input: MaintenanceInput) {
  const ctx = await getAuthContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = maintenanceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, location, priority } = parsed.data;

  await db.maintenanceRequest.create({
    data: {
      condominiumId: ctx.condominiumId,
      requesterId: ctx.userId,
      title,
      description,
      location: location || null,
      priority: priority as "BAIXA" | "MEDIA" | "ALTA" | "URGENTE",
    },
  });

  revalidatePath("/comunicacao/manutencao");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateMaintenanceStatus(requestId: string, input: MaintenanceUpdateInput) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "ADMIN") return { error: "Sem permissão" };

  const parsed = maintenanceUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const request = await db.maintenanceRequest.findFirst({
    where: { id: requestId, condominiumId: ctx.condominiumId },
  });

  if (!request) return { error: "Pedido não encontrado" };

  const { status, note } = parsed.data;

  await db.$transaction([
    db.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: status as "SUBMETIDO" | "EM_ANALISE" | "EM_CURSO" | "CONCLUIDO",
      },
    }),
    db.maintenanceUpdate.create({
      data: {
        maintenanceRequestId: requestId,
        status: status as "SUBMETIDO" | "EM_ANALISE" | "EM_CURSO" | "CONCLUIDO",
        note: note || null,
      },
    }),
  ]);

  revalidatePath("/comunicacao/manutencao");
  revalidatePath("/painel");
  return { success: true };
}

export async function deleteMaintenanceRequest(requestId: string) {
  const ctx = await getAuthContext();
  if (!ctx || ctx.role !== "ADMIN") return { error: "Sem permissão" };

  const request = await db.maintenanceRequest.findFirst({
    where: { id: requestId, condominiumId: ctx.condominiumId },
  });

  if (!request) return { error: "Pedido não encontrado" };

  await db.maintenanceRequest.delete({ where: { id: requestId } });

  revalidatePath("/comunicacao/manutencao");
  revalidatePath("/painel");
  return { success: true };
}
