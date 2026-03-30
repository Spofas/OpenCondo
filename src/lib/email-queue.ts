import { db } from "@/lib/db";

/**
 * Queue an email for sending. Inserts into PendingEmail table.
 * The cron job will pick it up and send it.
 */
export async function queueEmail(params: {
  recipient: string;
  subject: string;
  html: string;
  type: string;
  referenceId?: string;
}) {
  await db.pendingEmail.create({
    data: {
      recipient: params.recipient,
      subject: params.subject,
      html: params.html,
      type: params.type,
      referenceId: params.referenceId || null,
    },
  });
}

/**
 * Process pending emails. Called by the cron endpoint.
 * Sends unsent emails, retries failed ones (up to maxRetries).
 * Returns counts of sent and failed.
 */
export async function processPendingEmails(): Promise<{ sent: number; failed: number }> {
  const pending = await db.pendingEmail.findMany({
    where: {
      sentAt: null,
      retries: { lt: 3 }, // only retry up to maxRetries
    },
    orderBy: { createdAt: "asc" },
    take: 50, // batch size
  });

  let sent = 0;
  let failed = 0;

  for (const email of pending) {
    try {
      // Dynamic import to avoid circular dependency (email.ts may import from this file)
      const { getResend } = await import("@/lib/email");
      const resend = getResend();

      await resend.emails.send({
        from: "OpenCondo <noreply@opencondo.app>",
        to: email.recipient,
        subject: email.subject,
        html: email.html,
      });

      await db.pendingEmail.update({
        where: { id: email.id },
        data: { sentAt: new Date() },
      });
      sent++;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      await db.pendingEmail.update({
        where: { id: email.id },
        data: {
          retries: email.retries + 1,
          lastError: errorMessage,
        },
      });
      failed++;
    }
  }

  return { sent, failed };
}
