/**
 * Serializer helpers for Prisma models that contain Decimal / Date fields.
 *
 * Prisma's Decimal type is not JSON-serializable — passing it directly from a
 * server component to a client component throws at runtime. These helpers
 * centralize the `Number()` and `.toISOString()` conversions so individual
 * pages don't have to inline them.
 *
 * Pattern: each function returns a plain-object type that is safe to pass as a
 * prop. The `Serialized*` types are derived automatically via ReturnType so
 * client components stay in sync without a separate interface declaration.
 */

import type { Expense, Transaction, Quota, Unit, RecurringExpense } from "@prisma/client";

// ─── Expense ─────────────────────────────────────────────────────────────────

export function serializeExpense(e: Expense) {
  return {
    id: e.id,
    date: e.date.toISOString(),
    description: e.description,
    amount: Number(e.amount),
    category: e.category,
    supplierId: e.supplierId,
    budgetItemId: e.budgetItemId,
    invoiceUrl: e.invoiceUrl,
    isRecurring: e.isRecurring,
    notes: e.notes,
  };
}

export type SerializedExpense = ReturnType<typeof serializeExpense>;

// ─── Transaction ─────────────────────────────────────────────────────────────

export function serializeTransaction(t: Transaction) {
  return {
    id: t.id,
    date: t.date.toISOString(),
    amount: Number(t.amount),
    type: t.type,
    description: t.description,
    quotaId: t.quotaId,
    expenseId: t.expenseId,
  };
}

export type SerializedTransaction = ReturnType<typeof serializeTransaction>;

// ─── Quota ───────────────────────────────────────────────────────────────────

type QuotaWithUnit = Quota & {
  unit: Pick<Unit, "identifier" | "permilagem">;
};

export function serializeQuota(q: QuotaWithUnit) {
  return {
    id: q.id,
    unitId: q.unitId,
    unitIdentifier: q.unit.identifier,
    unitPermilagem: q.unit.permilagem,
    period: q.period,
    amount: Number(q.amount),
    dueDate: q.dueDate.toISOString(),
    status: q.status as "PENDING" | "PAID" | "OVERDUE",
    paymentDate: q.paymentDate?.toISOString() ?? null,
    paymentMethod: q.paymentMethod,
    paymentNotes: q.paymentNotes,
  };
}

export type SerializedQuota = ReturnType<typeof serializeQuota>;

// ─── RecurringExpense ─────────────────────────────────────────────────────────

export function serializeRecurringExpense(t: RecurringExpense) {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    category: t.category,
    frequency: t.frequency,
    isActive: t.isActive,
    lastGenerated: t.lastGenerated ?? null,
  };
}

export type SerializedRecurringExpense = ReturnType<typeof serializeRecurringExpense>;
