"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  quotaGenerateSchema,
  quotaPaymentSchema,
  type QuotaGenerateInput,
  type QuotaPaymentInput,
} from "@/lib/validators/quota";
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
 * Generate quota records for all units across a range of months.
 * The admin sets a total monthly amount and chooses how to split it.
 */
export async function generateQuotas(input: QuotaGenerateInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

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
  const unitAmounts = new Map<string, number>();

  if (unitOverrides && unitOverrides.length > 0) {
    // Manual mode: use provided amounts
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
    const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);
    if (totalPermilagem === 0) {
      return { error: "Permilagem total é 0 — configure a permilagem das frações" };
    }
    for (const unit of units) {
      const amount =
        Math.round((totalMonthlyAmount * unit.permilagem * 100) / totalPermilagem) / 100;
      unitAmounts.set(unit.id, amount);
    }
  } else {
    // Equal split
    const amount = Math.round((totalMonthlyAmount * 100) / units.length) / 100;
    for (const unit of units) {
      unitAmounts.set(unit.id, amount);
    }
  }

  // Generate month range
  const months: string[] = [];
  const [startYear, startMon] = startMonth.split("-").map(Number);
  const [endYear, endMon] = endMonth.split("-").map(Number);

  let year = startYear;
  let month = startMon;

  while (year < endYear || (year === endYear && month <= endMon)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

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

  revalidatePath("/financas/quotas");
  return {
    success: true,
    created,
    skipped,
    message: `${created} quota${created !== 1 ? "s" : ""} gerada${created !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} já existente${skipped !== 1 ? "s" : ""})` : ""}`,
  };
}

/**
 * Record payment for a quota.
 */
export async function recordPayment(quotaId: string, input: QuotaPaymentInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = quotaPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const quota = await db.quota.findFirst({
    where: { id: quotaId, condominiumId: ctx.condominiumId },
  });

  if (!quota) return { error: "Quota não encontrada" };
  if (quota.status === "PAID") return { error: "Quota já está paga" };

  await db.quota.update({
    where: { id: quotaId },
    data: {
      status: "PAID",
      paymentDate: new Date(parsed.data.paymentDate),
      paymentMethod: parsed.data.paymentMethod,
      paymentNotes: parsed.data.paymentNotes || null,
    },
  });

  revalidatePath("/financas/quotas");
  return { success: true };
}

/**
 * Undo a payment (set back to pending).
 */
export async function undoPayment(quotaId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const quota = await db.quota.findFirst({
    where: { id: quotaId, condominiumId: ctx.condominiumId },
  });

  if (!quota) return { error: "Quota não encontrada" };
  if (quota.status !== "PAID") return { error: "Quota não está marcada como paga" };

  const now = new Date();
  const newStatus = quota.dueDate < now ? "OVERDUE" : "PENDING";

  await db.quota.update({
    where: { id: quotaId },
    data: {
      status: newStatus,
      paymentDate: null,
      paymentMethod: null,
      paymentNotes: null,
    },
  });

  revalidatePath("/financas/quotas");
  return { success: true };
}

/**
 * Delete all quotas for a given period (month).
 * Only deletes unpaid (PENDING/OVERDUE) quotas.
 */
export async function deleteQuotasByPeriod(period: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const result = await db.quota.deleteMany({
    where: {
      condominiumId: ctx.condominiumId,
      period,
      status: { in: ["PENDING", "OVERDUE"] },
    },
  });

  revalidatePath("/financas/quotas");
  return {
    success: true,
    deleted: result.count,
    message: `${result.count} quota${result.count !== 1 ? "s" : ""} eliminada${result.count !== 1 ? "s" : ""}`,
  };
}

/**
 * Mark overdue quotas — called when loading the page.
 * Updates any PENDING quotas past their due date to OVERDUE.
 */
export async function markOverdueQuotas() {
  const ctx = await getAdminContext();
  if (!ctx) return { updated: 0 };

  const now = new Date();
  const result = await db.quota.updateMany({
    where: {
      condominiumId: ctx.condominiumId,
      status: "PENDING",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });

  if (result.count > 0) {
    revalidatePath("/financas/quotas");
  }

  return { updated: result.count };
}
