import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isDueThisPeriod } from "@/lib/cron-utils";
import { sendBulkQuotaReminders } from "@/lib/email";
import { processPendingEmails } from "@/lib/email-queue";
import { checkRateLimit } from "@/lib/rate-limit";

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

  const { allowed } = checkRateLimit("cron:process", {
    maxRequests: 2,
    windowMs: 60 * 60 * 1000, // max 2 calls per hour
  });
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
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

  // 3. Send quota reminder emails (7 days before due)
  const condominiums = await db.condominium.findMany({ select: { id: true } });
  let remindersSent = 0;
  for (const condo of condominiums) {
    try {
      await sendBulkQuotaReminders(condo.id, 7);
      remindersSent++;
    } catch {
      // Continue with other condominiums
    }
  }
  results.condosWithReminders = remindersSent;

  // 4. Process pending email queue (send queued emails, retry failed ones)
  try {
    const emailResults = await processPendingEmails();
    results.emailsSent = emailResults.sent;
    results.emailsFailed = emailResults.failed;
  } catch {
    results.emailQueueError = "Failed to process email queue";
  }

  return NextResponse.json({ success: true, period: currentPeriod, ...results });
}

