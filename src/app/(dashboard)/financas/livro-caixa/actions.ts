"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  openingBalanceSchema,
  adjustmentSchema,
  type OpeningBalanceInput,
  type AdjustmentInput,
} from "@/lib/validators/ledger";
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

/**
 * Set or update the opening balance for this condominium.
 * Only one OPENING_BALANCE entry is allowed per condo.
 */
export async function setOpeningBalance(input: OpeningBalanceInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = openingBalanceSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, date, description } = parsed.data;
  const desc = description?.trim() || "Saldo inicial";

  const existing = await db.transaction.findFirst({
    where: { condominiumId: ctx.condominiumId, type: "OPENING_BALANCE" },
  });

  if (existing) {
    await db.transaction.update({
      where: { id: existing.id },
      data: { amount, date: new Date(date), description: desc },
    });
  } else {
    await db.transaction.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: new Date(date),
        amount,
        type: "OPENING_BALANCE",
        description: desc,
      },
    });
  }

  revalidatePath("/financas/livro-caixa");
  return { success: true };
}

/**
 * Add a manual adjustment (positive or negative).
 */
export async function addAdjustment(input: AdjustmentInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = adjustmentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { amount, date, description } = parsed.data;

  await db.transaction.create({
    data: {
      condominiumId: ctx.condominiumId,
      date: new Date(date),
      amount,
      type: "ADJUSTMENT",
      description,
    },
  });

  revalidatePath("/financas/livro-caixa");
  return { success: true };
}

/**
 * Delete a manual adjustment. OPENING_BALANCE, QUOTA_PAYMENT, and EXPENSE
 * transactions cannot be deleted here — only ADJUSTMENT entries.
 */
export async function deleteAdjustment(transactionId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const tx = await db.transaction.findFirst({
    where: { id: transactionId, condominiumId: ctx.condominiumId },
  });

  if (!tx) return { error: "Movimento não encontrado" };
  if (tx.type !== "ADJUSTMENT")
    return { error: "Apenas ajustes manuais podem ser eliminados aqui" };

  await db.transaction.delete({ where: { id: transactionId } });

  revalidatePath("/financas/livro-caixa");
  return { success: true };
}
