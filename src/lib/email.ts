import { Resend } from "resend";
import { db } from "@/lib/db";
import { queueEmail } from "@/lib/email-queue";

let _resend: Resend | null = null;
export function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "OpenCondo <noreply@opencondo.app>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Shared email layout ─────────────────────────────────────────────────────

function emailWrapper(content: string) {
  return `
    <div style="font-family:'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 16px;color:#1a1a1a">
      <div style="margin-bottom:24px">
        <span style="font-size:18px;font-weight:700;color:#2563eb">OpenCondo</span>
      </div>
      ${content}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px">
      <p style="color:#9ca3af;font-size:12px;margin:0">
        OpenCondo · Gestão de condomínios<br>
        <a href="${BASE_URL}/minha-conta" style="color:#9ca3af">Gerir preferências de notificação</a>
      </p>
    </div>
  `;
}

function emailButton(href: string, label: string) {
  return `
    <a href="${href}"
       style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
              padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px">
      ${label}
    </a>
  `;
}

// ─── Auth emails (password reset, invites) ───────────────────────────────────

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${BASE_URL}/recuperar-password/${token}`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Recuperação de palavra-passe — OpenCondo",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px">Recuperar palavra-passe</h2>
      <p style="color:#6b7280;margin:0 0 24px;font-size:14px">
        Recebemos um pedido para redefinir a palavra-passe da sua conta OpenCondo.
        Clique no botão abaixo para criar uma nova palavra-passe.
        O link é válido durante <strong>1 hora</strong>.
      </p>
      ${emailButton(resetUrl, "Redefinir palavra-passe")}
      <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
        Se não solicitou esta ação, pode ignorar este email.
        A sua palavra-passe não será alterada.
      </p>
    `),
  });
}

export async function sendInviteEmail(
  to: string,
  token: string,
  condominiumName: string,
  role: "OWNER" | "TENANT"
) {
  const roleLabel = role === "OWNER" ? "Proprietário" : "Inquilino";
  const joinUrl = `${BASE_URL}/entrar?token=${token}`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Convite para ${condominiumName} — OpenCondo`,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px">Foi convidado para ${condominiumName}</h2>
      <p style="color:#6b7280;margin:0 0 8px;font-size:14px">
        Foi convidado para aceder ao condomínio <strong>${condominiumName}</strong>
        na plataforma OpenCondo como <strong>${roleLabel}</strong>.
      </p>
      <p style="color:#6b7280;margin:0 0 24px;font-size:14px">
        Clique no botão abaixo para criar a sua conta ou iniciar sessão e aceitar o convite.
        O convite é válido durante <strong>7 dias</strong>.
      </p>
      ${emailButton(joinUrl, "Aceitar convite")}
      <p style="color:#9ca3af;font-size:13px;margin:24px 0 0">
        Em alternativa, aceda a <a href="${BASE_URL}/entrar" style="color:#2563eb">${BASE_URL}/entrar</a>
        e introduza o código: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${token}</code>
      </p>
    `),
  });
}

// ─── Notification preference helpers ─────────────────────────────────────────

type NotificationType = "quotas" | "announcements" | "meetings" | "maintenance" | "contracts";

const NOTIFICATION_DEFAULTS: Record<NotificationType, boolean> = {
  quotas: true,
  announcements: true,
  meetings: true,
  maintenance: false,
  contracts: false,
};

/**
 * Get recipients who have a specific notification enabled for a condominium.
 * If a user has no NotificationPreference record, defaults apply.
 */
async function getNotificationRecipients(
  condominiumId: string,
  type: NotificationType,
  excludeUserId?: string
): Promise<{ email: string; name: string }[]> {
  const members = await db.membership.findMany({
    where: { condominiumId, isActive: true },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          notificationPreferences: {
            where: { condominiumId },
            take: 1,
          },
        },
      },
    },
  });

  return members
    .filter((m) => {
      if (excludeUserId && m.user.id === excludeUserId) return false;
      const pref = m.user.notificationPreferences[0];
      return pref ? pref[type] : NOTIFICATION_DEFAULTS[type];
    })
    .map((m) => ({ email: m.user.email, name: m.user.name }));
}

// ─── Notification emails ─────────────────────────────────────────────────────

export async function sendAnnouncementNotification(
  condominiumId: string,
  condominiumName: string,
  authorName: string,
  title: string,
  category: string,
  authorUserId: string
) {
  if (!process.env.RESEND_API_KEY) return;

  const recipients = await getNotificationRecipients(condominiumId, "announcements", authorUserId);
  if (recipients.length === 0) return;

  const categoryLabels: Record<string, string> = {
    GERAL: "Geral", OBRAS: "Obras", MANUTENCAO: "Manutenção",
    ASSEMBLEIA: "Assembleia", URGENTE: "Urgente",
  };
  const catLabel = categoryLabels[category] ?? category;
  const isUrgent = category === "URGENTE";

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px">${isUrgent ? "⚠️ " : ""}Novo aviso: ${title}</h2>
    <p style="color:#6b7280;margin:0 0 16px;font-size:14px">
      <strong>${condominiumName}</strong> · ${catLabel} · por ${authorName}
    </p>
    <p style="color:#374151;margin:0 0 24px;font-size:14px">
      Foi publicado um novo aviso no seu condomínio. Consulte os detalhes na plataforma.
    </p>
    ${emailButton(`${BASE_URL}/comunicacao/avisos`, "Ver aviso")}
  `);

  await Promise.allSettled(
    recipients.map((r) =>
      queueEmail({
        recipient: r.email,
        subject: `${isUrgent ? "⚠️ " : ""}Novo aviso: ${title} — ${condominiumName}`,
        html,
        type: "ANNOUNCEMENT",
        referenceId: condominiumId,
      })
    )
  );
}

export async function sendMeetingNotification(
  condominiumId: string,
  condominiumName: string,
  meetingDate: Date,
  location: string,
  type: "ORDINARIA" | "EXTRAORDINARIA"
) {
  if (!process.env.RESEND_API_KEY) return;

  const recipients = await getNotificationRecipients(condominiumId, "meetings");
  if (recipients.length === 0) return;

  const typeLabel = type === "ORDINARIA" ? "Ordinária" : "Extraordinária";
  const dateStr = meetingDate.toLocaleDateString("pt-PT", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px">Assembleia ${typeLabel} convocada</h2>
    <p style="color:#6b7280;margin:0 0 20px;font-size:14px">
      <strong>${condominiumName}</strong>
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:14px"><strong>Data:</strong> ${dateStr}</p>
      <p style="margin:0;font-size:14px"><strong>Local:</strong> ${location}</p>
    </div>
    <p style="color:#374151;margin:0 0 24px;font-size:14px">
      A sua presença é importante. Consulte a ordem de trabalhos na plataforma.
    </p>
    ${emailButton(`${BASE_URL}/assembleia/reunioes`, "Ver detalhes")}
  `);

  await Promise.allSettled(
    recipients.map((r) =>
      queueEmail({
        recipient: r.email,
        subject: `Assembleia ${typeLabel} — ${dateStr} — ${condominiumName}`,
        html,
        type: "MEETING",
        referenceId: condominiumId,
      })
    )
  );
}

export async function sendQuotaReminderNotification(
  condominiumId: string,
  condominiumName: string,
  unitIdentifier: string,
  ownerEmail: string,
  ownerUserId: string,
  period: string,
  amount: number,
  dueDate: Date
) {
  if (!process.env.RESEND_API_KEY) return;

  const userPref = await db.notificationPreference.findUnique({
    where: { userId_condominiumId: { userId: ownerUserId, condominiumId } },
  });
  // Default for quotas is true
  if (userPref && !userPref.quotas) return;

  const dueDateStr = dueDate.toLocaleDateString("pt-PT", {
    year: "numeric", month: "long", day: "numeric",
  });
  const amountStr = amount.toLocaleString("pt-PT", { style: "currency", currency: "EUR" });

  const html = emailWrapper(`
    <h2 style="margin:0 0 8px;font-size:20px">Quota pendente</h2>
    <p style="color:#6b7280;margin:0 0 20px;font-size:14px">
      <strong>${condominiumName}</strong> · Fração ${unitIdentifier}
    </p>
    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:14px"><strong>Período:</strong> ${period}</p>
      <p style="margin:0 0 8px;font-size:14px"><strong>Valor:</strong> ${amountStr}</p>
      <p style="margin:0;font-size:14px"><strong>Vencimento:</strong> ${dueDateStr}</p>
    </div>
    ${emailButton(`${BASE_URL}/financas/quotas`, "Ver quotas")}
  `);

  await queueEmail({
    recipient: ownerEmail,
    subject: `Quota pendente: ${amountStr} — ${condominiumName}`,
    html,
    type: "QUOTA_REMINDER",
    referenceId: condominiumId,
  });
}

/**
 * Send quota reminders for all pending quotas due within `daysBeforeDue` days.
 * Intended to be called from the cron job.
 */
export async function sendBulkQuotaReminders(condominiumId: string, daysBeforeDue: number = 7) {
  if (!process.env.RESEND_API_KEY) return;

  const now = new Date();
  const reminderCutoff = new Date(now.getTime() + daysBeforeDue * 24 * 60 * 60 * 1000);

  const pendingQuotas = await db.quota.findMany({
    where: {
      condominiumId,
      status: "PENDING",
      dueDate: { lte: reminderCutoff, gte: now },
    },
    include: {
      unit: { include: { owner: { select: { id: true, email: true, name: true } } } },
      condominium: { select: { name: true } },
    },
  });

  for (const quota of pendingQuotas) {
    if (!quota.unit.owner) continue;
    try {
      await sendQuotaReminderNotification(
        condominiumId,
        quota.condominium.name,
        quota.unit.identifier,
        quota.unit.owner.email,
        quota.unit.owner.id,
        quota.period,
        Number(quota.amount),
        quota.dueDate
      );
    } catch {
      console.error(`Failed to send quota reminder for ${quota.unit.identifier} ${quota.period}`);
    }
  }
}
