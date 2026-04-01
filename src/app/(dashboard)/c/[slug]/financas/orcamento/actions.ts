"use server";

import { db } from "@/lib/db";
import { budgetSchema, type BudgetInput } from "@/lib/validators/budget";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

export const createBudget = withAdmin(async (ctx, input: BudgetInput) => {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { year, reserveFundPercentage, items } = parsed.data;

  // Check for duplicate year
  const existing = await db.budget.findUnique({
    where: {
      condominiumId_year: {
        condominiumId: ctx.condominiumId,
        year,
      },
    },
  });

  if (existing) {
    return { error: `Já existe um orçamento para ${year}` };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.plannedAmount, 0);

  const budget = await db.budget.create({
    data: {
      condominiumId: ctx.condominiumId,
      year,
      totalAmount,
      reserveFundPercentage,
      items: {
        create: items.map((item) => ({
          category: item.category,
          description: item.description || null,
          plannedAmount: item.plannedAmount,
        })),
      },
    },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true, budgetId: budget.id };
});

export const updateBudget = withAdmin(async (ctx, budgetId: string, input: BudgetInput) => {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const budget = await db.budget.findFirst({
    where: { id: budgetId, condominiumId: ctx.condominiumId },
  });

  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APPROVED") {
    return { error: "Não é possível editar um orçamento aprovado" };
  }

  const { year, reserveFundPercentage, items } = parsed.data;

  // Check for year conflict with other budgets
  const yearConflict = await db.budget.findFirst({
    where: {
      condominiumId: ctx.condominiumId,
      year,
      id: { not: budgetId },
    },
  });

  if (yearConflict) {
    return { error: `Já existe um orçamento para ${year}` };
  }

  const totalAmount = items.reduce((sum, item) => sum + item.plannedAmount, 0);

  // Delete existing items and recreate atomically
  await db.$transaction(async (tx) => {
    await tx.budgetItem.deleteMany({ where: { budgetId } });
    await tx.budget.update({
      where: { id: budgetId },
      data: {
        year,
        totalAmount,
        reserveFundPercentage,
        items: {
          create: items.map((item) => ({
            category: item.category,
            description: item.description || null,
            plannedAmount: item.plannedAmount,
          })),
        },
      },
    });
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

export const approveBudget = withAdmin(async (ctx, budgetId: string) => {
  const budget = await db.budget.findFirst({
    where: { id: budgetId, condominiumId: ctx.condominiumId },
  });

  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APPROVED") {
    return { error: "Orçamento já está aprovado" };
  }

  await db.budget.update({
    where: { id: budgetId },
    data: { status: "APPROVED", approvedAt: new Date() },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

export const deleteBudget = withAdmin(async (ctx, budgetId: string) => {
  const budget = await db.budget.findFirst({
    where: { id: budgetId, condominiumId: ctx.condominiumId },
    include: { _count: { select: { items: true } } },
  });

  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APPROVED") {
    return { error: "Não é possível eliminar um orçamento aprovado" };
  }

  await db.budget.delete({ where: { id: budgetId } });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});
