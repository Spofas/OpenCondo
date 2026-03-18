"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { expenseSchema, type ExpenseInput } from "@/lib/validators/expense";
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

export async function createExpense(input: ExpenseInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = expenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { date, description, amount, category, notes } = parsed.data;

  await db.expense.create({
    data: {
      condominiumId: ctx.condominiumId,
      date: new Date(date),
      description,
      amount,
      category,
      notes: notes || null,
    },
  });

  revalidatePath("/financas/despesas");
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

  await db.expense.update({
    where: { id: expenseId },
    data: {
      date: new Date(date),
      description,
      amount,
      category,
      notes: notes || null,
    },
  });

  revalidatePath("/financas/despesas");
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
