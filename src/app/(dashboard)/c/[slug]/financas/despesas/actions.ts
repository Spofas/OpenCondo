"use server";

import { db } from "@/lib/db";
import { expenseSchema, type ExpenseInput } from "@/lib/validators/expense";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

export const createExpense = withAdmin(async (ctx, input: ExpenseInput) => {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, description, amount, category, notes, invoiceUrl } = parsed.data;

  await db.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: new Date(date),
        description,
        amount,
        category,
        notes: notes || null,
        invoiceUrl: invoiceUrl || null,
      },
    });
    await tx.transaction.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: new Date(date),
        amount: -amount,
        type: "EXPENSE",
        description,
        expenseId: expense.id,
      },
    });
  });

  revalidatePath("/c/");
  return { success: true };
});

export const updateExpense = withAdmin(async (ctx, expenseId: string, input: ExpenseInput) => {
  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const expense = await db.expense.findFirst({
    where: { id: expenseId, condominiumId: ctx.condominiumId, deletedAt: null },
  });

  if (!expense) return { error: "Despesa não encontrada" };

  const { date, description, amount, category, notes, invoiceUrl } = parsed.data;

  await db.$transaction([
    db.expense.update({
      where: { id: expenseId },
      data: {
        date: new Date(date),
        description,
        amount,
        category,
        notes: notes || null,
        invoiceUrl: invoiceUrl || null,
      },
    }),
    db.transaction.updateMany({
      where: { expenseId, deletedAt: null },
      data: {
        date: new Date(date),
        amount: -amount,
        description,
      },
    }),
  ]);

  revalidatePath("/c/");
  return { success: true };
});

export const deleteExpense = withAdmin(async (ctx, expenseId: string) => {
  const expense = await db.expense.findFirst({
    where: { id: expenseId, condominiumId: ctx.condominiumId, deletedAt: null },
  });

  if (!expense) return { error: "Despesa não encontrada" };

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id: expenseId },
      data: { deletedAt: now },
    });
    await tx.transaction.updateMany({
      where: { expenseId, deletedAt: null },
      data: { deletedAt: now },
    });
  });

  revalidatePath("/c/");
  return { success: true };
});
