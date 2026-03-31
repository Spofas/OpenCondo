"use server";

import { db } from "@/lib/db";
import {
  openingBalanceSchema,
  adjustmentSchema,
  type OpeningBalanceInput,
  type AdjustmentInput,
} from "@/lib/validators/ledger";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

/**
 * Set or update the opening balance for this condominium.
 * Only one OPENING_BALANCE entry is allowed per condo.
 */
export const setOpeningBalance = withAdmin(async (ctx, input: OpeningBalanceInput) => {
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

  revalidatePath("/c/");
  return { success: true };
});

/**
 * Add a manual adjustment (positive or negative).
 */
export const addAdjustment = withAdmin(async (ctx, input: AdjustmentInput) => {
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

  revalidatePath("/c/");
  return { success: true };
});

/**
 * Delete a manual adjustment. OPENING_BALANCE, QUOTA_PAYMENT, and EXPENSE
 * transactions cannot be deleted here — only ADJUSTMENT entries.
 */
export const deleteAdjustment = withAdmin(async (ctx, transactionId: string) => {
  const tx = await db.transaction.findFirst({
    where: { id: transactionId, condominiumId: ctx.condominiumId },
  });

  if (!tx) return { error: "Movimento não encontrado" };
  if (tx.type !== "ADJUSTMENT")
    return { error: "Apenas ajustes manuais podem ser eliminados aqui" };

  await db.transaction.delete({ where: { id: transactionId } });

  revalidatePath("/c/");
  return { success: true };
});
