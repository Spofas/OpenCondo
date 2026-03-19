"use server";

import { db } from "@/lib/db";
import {
  recurringExpenseSchema,
  type RecurringExpenseInput,
  FREQUENCY_MONTHS,
} from "@/lib/validators/recurring-expense";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/admin-context";

export async function createRecurringExpense(input: RecurringExpenseInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = recurringExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.recurringExpense.create({
    data: {
      condominiumId: ctx.condominiumId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      category: parsed.data.category,
      frequency: parsed.data.frequency,
    },
  });

  revalidatePath("/financas/despesas-recorrentes");
  return { success: true };
}

export async function updateRecurringExpense(
  id: string,
  input: RecurringExpenseInput
) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = recurringExpenseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const existing = await db.recurringExpense.findFirst({
    where: { id, condominiumId: ctx.condominiumId },
  });
  if (!existing) return { error: "Despesa recorrente não encontrada" };

  await db.recurringExpense.update({
    where: { id },
    data: {
      description: parsed.data.description,
      amount: parsed.data.amount,
      category: parsed.data.category,
      frequency: parsed.data.frequency,
    },
  });

  revalidatePath("/financas/despesas-recorrentes");
  return { success: true };
}

export async function toggleRecurringExpense(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const existing = await db.recurringExpense.findFirst({
    where: { id, condominiumId: ctx.condominiumId },
  });
  if (!existing) return { error: "Despesa recorrente não encontrada" };

  await db.recurringExpense.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/financas/despesas-recorrentes");
  return { success: true };
}

export async function deleteRecurringExpense(id: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const existing = await db.recurringExpense.findFirst({
    where: { id, condominiumId: ctx.condominiumId },
  });
  if (!existing) return { error: "Despesa recorrente não encontrada" };

  await db.recurringExpense.delete({ where: { id } });

  revalidatePath("/financas/despesas-recorrentes");
  return { success: true };
}

/**
 * Generate actual expenses for the given month from active recurring templates.
 * Only generates if not already generated for the period (checks lastGenerated).
 */
export async function generateRecurringExpenses(period: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  // Validate period format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(period)) {
    return { error: "Período inválido (YYYY-MM)" };
  }

  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const templates = await db.recurringExpense.findMany({
    where: { condominiumId: ctx.condominiumId, isActive: true },
  });

  let generated = 0;
  let skipped = 0;

  for (const tmpl of templates) {
    // Check frequency: should we generate for this month?
    const freqMonths = FREQUENCY_MONTHS[tmpl.frequency] || 1;
    if (freqMonths > 1 && month % freqMonths !== 1) {
      // For quarterly: generate in months 1,4,7,10
      // For semi-annual: generate in months 1,7
      // For annual: generate in month 1
      skipped++;
      continue;
    }

    // Check if already generated for this period
    if (tmpl.lastGenerated === period) {
      skipped++;
      continue;
    }

    // Create the expense
    await db.expense.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: new Date(year, month - 1, 1),
        description: tmpl.description,
        amount: tmpl.amount,
        category: tmpl.category,
        isRecurring: true,
      },
    });

    // Update lastGenerated
    await db.recurringExpense.update({
      where: { id: tmpl.id },
      data: { lastGenerated: period },
    });

    generated++;
  }

  revalidatePath("/financas/despesas-recorrentes");
  revalidatePath("/financas/despesas");
  revalidatePath("/painel");

  return {
    success: true,
    generated,
    skipped,
    message: `${generated} despesa${generated !== 1 ? "s" : ""} gerada${generated !== 1 ? "s" : ""} para ${period}`,
  };
}
