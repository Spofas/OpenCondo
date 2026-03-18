"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { budgetSchema, type BudgetInput } from "@/lib/validators/budget";
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

export async function createBudget(input: BudgetInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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

  revalidatePath("/financas/orcamento");
  return { success: true, budgetId: budget.id };
}

export async function updateBudget(budgetId: string, input: BudgetInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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

  // Delete existing items and recreate
  await db.budgetItem.deleteMany({ where: { budgetId } });

  await db.budget.update({
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

  revalidatePath("/financas/orcamento");
  return { success: true };
}

export async function approveBudget(budgetId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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

  revalidatePath("/financas/orcamento");
  return { success: true };
}

export async function deleteBudget(budgetId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const budget = await db.budget.findFirst({
    where: { id: budgetId, condominiumId: ctx.condominiumId },
    include: { _count: { select: { items: true } } },
  });

  if (!budget) return { error: "Orçamento não encontrado" };
  if (budget.status === "APPROVED") {
    return { error: "Não é possível eliminar um orçamento aprovado" };
  }

  await db.budget.delete({ where: { id: budgetId } });

  revalidatePath("/financas/orcamento");
  return { success: true };
}
