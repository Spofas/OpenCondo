"use server";

import { db } from "@/lib/db";
import { withAdmin, withMember } from "@/lib/auth/admin-context";
import {
  maintenanceSchema,
  maintenanceUpdateSchema,
  type MaintenanceInput,
  type MaintenanceUpdateInput,
} from "@/lib/validators/maintenance";
import { revalidatePath } from "next/cache";

export const createMaintenanceRequest = withMember(async (ctx, input: MaintenanceInput) => {
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
});

export const updateMaintenanceStatus = withAdmin(async (ctx, requestId: string, input: MaintenanceUpdateInput) => {
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
});

export const deleteMaintenanceRequest = withAdmin(async (ctx, requestId: string) => {
  const request = await db.maintenanceRequest.findFirst({
    where: { id: requestId, condominiumId: ctx.condominiumId },
  });

  if (!request) return { error: "Pedido não encontrado" };

  await db.maintenanceRequest.delete({ where: { id: requestId } });

  revalidatePath("/comunicacao/manutencao");
  revalidatePath("/painel");
  return { success: true };
});
