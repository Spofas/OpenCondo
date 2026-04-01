"use server";

import { db } from "@/lib/db";
import {
  quotaGenerateSchema,
  quotaPaymentSchema,
  type QuotaGenerateInput,
  type QuotaPaymentInput,
} from "@/lib/validators/quota";
import {
  splitByPermilagem,
  splitEqually,
  generateMonthRange,
  statusAfterUndo,
} from "@/lib/quota-calculations";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

/**
 * Generate quota records for all units across a range of months.
 * The admin sets a total monthly amount and chooses how to split it.
 */
export const generateQuotas = withAdmin(async (ctx, input: QuotaGenerateInput) => {
  const parsed = quotaGenerateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { startMonth, endMonth, totalMonthlyAmount, splitMethod, dueDay, unitOverrides } =
    parsed.data;

  // Fetch all units for this condominium
  const units = await db.unit.findMany({
    where: { condominiumId: ctx.condominiumId },
    orderBy: { identifier: "asc" },
  });

  if (units.length === 0) {
    return { error: "Não existem frações registadas neste condomínio" };
  }

  // Calculate amount per unit
  let unitAmounts: Map<string, number>;

  if (unitOverrides && unitOverrides.length > 0) {
    // Manual mode: use provided amounts
    unitAmounts = new Map<string, number>();
    for (const override of unitOverrides) {
      unitAmounts.set(override.unitId, override.amount);
    }
    // Fill in any units not in overrides with 0
    for (const unit of units) {
      if (!unitAmounts.has(unit.id)) {
        unitAmounts.set(unit.id, 0);
      }
    }
  } else if (splitMethod === "PERMILAGEM") {
    unitAmounts = splitByPermilagem(totalMonthlyAmount, units);
    if (unitAmounts.size === 0) {
      return { error: "Permilagem total é 0 — configure a permilagem das frações" };
    }
  } else {
    unitAmounts = splitEqually(totalMonthlyAmount, units);
  }

  // Generate month range
  const months = generateMonthRange(startMonth, endMonth);

  if (months.length === 0) {
    return { error: "Período inválido" };
  }

  if (months.length > 24) {
    return { error: "Máximo de 24 meses por geração" };
  }

  // Create quota records, skipping any that already exist
  let created = 0;
  let skipped = 0;

  for (const period of months) {
    const [y, m] = period.split("-").map(Number);
    const dueDate = new Date(y, m - 1, dueDay); // month is 0-indexed in JS Date

    for (const unit of units) {
      const amount = unitAmounts.get(unit.id) || 0;
      if (amount <= 0) continue;

      try {
        await db.quota.create({
          data: {
            condominiumId: ctx.condominiumId,
            unitId: unit.id,
            period,
            amount,
            dueDate,
            status: "PENDING",
          },
        });
        created++;
      } catch {
        // Unique constraint violation — quota already exists for this unit+period
        skipped++;
      }
    }
  }

  revalidatePath(`/c/${ctx.slug}`);
  return {
    success: true,
    created,
    skipped,
    message: `${created} quota${created !== 1 ? "s" : ""} gerada${created !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} já existente${skipped !== 1 ? "s" : ""})` : ""}`,
  };
});

/**
 * Record payment for a quota.
 */
export const recordPayment = withAdmin(async (ctx, quotaId: string, input: QuotaPaymentInput) => {
  const parsed = quotaPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const result = await db.$transaction(async (tx) => {
    const quota = await tx.quota.findFirst({
      where: { id: quotaId, condominiumId: ctx.condominiumId },
      include: { unit: true },
    });

    if (!quota) return { error: "Quota não encontrada" };
    if (quota.status === "PAID") return { error: "Quota já está paga" };

    const paymentDate = new Date(parsed.data.paymentDate);

    await tx.quota.update({
      where: { id: quotaId },
      data: {
        status: "PAID",
        paymentDate,
        paymentMethod: parsed.data.paymentMethod,
        paymentNotes: parsed.data.paymentNotes || null,
      },
    });

    await tx.transaction.create({
      data: {
        condominiumId: ctx.condominiumId,
        date: paymentDate,
        amount: quota.amount,
        type: "QUOTA_PAYMENT",
        description: `Quota ${quota.period} — ${quota.unit.identifier}`,
        quotaId,
      },
    });

    return { success: true as const };
  });

  if ("success" in result) {
    revalidatePath(`/c/${ctx.slug}`);
  }
  return result;
});

/**
 * Undo a payment (set back to pending).
 */
export const undoPayment = withAdmin(async (ctx, quotaId: string) => {
  const quota = await db.quota.findFirst({
    where: { id: quotaId, condominiumId: ctx.condominiumId },
  });

  if (!quota) return { error: "Quota não encontrada" };
  if (quota.status !== "PAID") return { error: "Quota não está marcada como paga" };

  const newStatus = statusAfterUndo(quota.dueDate);

  await db.$transaction([
    db.quota.update({
      where: { id: quotaId },
      data: {
        status: newStatus,
        paymentDate: null,
        paymentMethod: null,
        paymentNotes: null,
      },
    }),
    db.transaction.updateMany({
      where: { quotaId, deletedAt: null },
      data: { deletedAt: new Date() },
    }),
  ]);

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

/**
 * Delete all quotas for a given period (month).
 * Only deletes unpaid (PENDING/OVERDUE) quotas.
 */
export const deleteQuotasByPeriod = withAdmin(async (ctx, period: string) => {
  const result = await db.quota.updateMany({
    where: {
      condominiumId: ctx.condominiumId,
      period,
      status: { in: ["PENDING", "OVERDUE"] },
      deletedAt: null,
    },
    data: { deletedAt: new Date() },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return {
    success: true,
    deleted: result.count,
    message: `${result.count} quota${result.count !== 1 ? "s" : ""} eliminada${result.count !== 1 ? "s" : ""}`,
  };
});

// markOverdueQuotas removed — overdue marking handled by nightly cron job (api/cron/process)
