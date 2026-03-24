"use server";

import { db } from "@/lib/db";
import { expenseSchema, type ExpenseInput } from "@/lib/validators/expense";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/admin-context";

export async function createExpense(input: ExpenseInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, description, amount, category, notes } = parsed.data;

  await db.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: new Date(date),
        description,
        amount,
        category,
        notes: notes || null,
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

  revalidatePath("/financas/despesas");
  revalidatePath("/financas/livro-caixa");
  revalidatePath("/painel");
  return { success: true };
}

export async function updateExpense(expenseId: string, input: ExpenseInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const expense = await db.expense.findFirst({
    where: { id: expenseId, condominiumId: ctx.condominiumId },
  });

  if (!expense) return { error: "Despesa não encontrada" };

  const { date, description, amount, category, notes } = parsed.data;

  await db.$transaction([
    db.expense.update({
      where: { id: expenseId },
      data: {
        date: new Date(date),
        description,
        amount,
        category,
        notes: notes || null,
      },
    }),
    db.transaction.updateMany({
      where: { expenseId },
      data: {
        date: new Date(date),
        amount: -amount,
        description,
      },
    }),
  ]);

  revalidatePath("/financas/despesas");
  revalidatePath("/financas/livro-caixa");
  revalidatePath("/painel");
  return { success: true };
}

export async function deleteExpense(expenseId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const expense = await db.expense.findFirst({
    where: { id: expenseId, condominiumId: ctx.condominiumId },
  });

  if (!expense) return { error: "Despesa não encontrada" };

  await db.expense.delete({ where: { id: expenseId } });

  revalidatePath("/financas/despesas");
  revalidatePath("/painel");
  return { success: true };
}
