import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Nightly cron job — runs at 02:00 UTC via Vercel Cron (vercel.json).
 *
 * Responsibilities:
 * 1. Mark all PENDING quotas past their due date as OVERDUE (all condominiums).
 * 2. Generate recurring expenses for all active condominiums.
 *
 * Protected by CRON_SECRET env var. Vercel sends this automatically when
 * configured; set the same secret in your Vercel project env vars.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, unknown> = {};

  // 1. Mark overdue quotas across ALL condominiums in one query
  const { count: overdueMarked } = await db.quota.updateMany({
    where: { status: "PENDING", dueDate: { lt: now }, deletedAt: null },
    data: { status: "OVERDUE" },
  });
  results.overdueMarked = overdueMarked;

  // 2. Generate recurring expenses for all active condominiums
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const templates = await db.recurringExpense.findMany({
    where: { isActive: true },
  });

  let expensesGenerated = 0;

  for (const template of templates) {
    // Skip if already generated for this period
    if (template.lastGenerated === currentPeriod) continue;

    // Skip non-monthly frequencies that aren't due this month
    if (!isDueThisPeriod(template.frequency, now)) continue;

    await db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          condominiumId: template.condominiumId,
          date: now,
          description: template.description,
          amount: template.amount,
          category: template.category,
          isRecurring: true,
        },
      });

      await tx.transaction.create({
        data: {
          condominiumId: template.condominiumId,
          date: now,
          amount: -Number(template.amount),
          type: "EXPENSE",
          description: template.description,
          expenseId: expense.id,
        },
      });

      await tx.recurringExpense.update({
        where: { id: template.id },
        data: { lastGenerated: currentPeriod },
      });
    });

    expensesGenerated++;
  }

  results.expensesGenerated = expensesGenerated;

  return NextResponse.json({ success: true, period: currentPeriod, ...results });
}

/**
 * Returns true if the given frequency is due in the current month.
 * MENSAL = every month, TRIMESTRAL = every 3 months (Jan, Apr, Jul, Oct),
 * SEMESTRAL = every 6 months (Jan, Jul), ANUAL = January only.
 * PONTUAL = never auto-generated.
 */
function isDueThisPeriod(frequency: string, now: Date): boolean {
  const month = now.getMonth() + 1; // 1-indexed
  switch (frequency) {
    case "MENSAL":
      return true;
    case "TRIMESTRAL":
      return month % 3 === 1; // Jan(1), Apr(4), Jul(7), Oct(10)
    case "SEMESTRAL":
      return month === 1 || month === 7;
    case "ANUAL":
      return month === 1;
    default:
      return false; // PONTUAL — manual only
  }
}
