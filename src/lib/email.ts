import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "OpenCondo <noreply@opencondo.app>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetUrl = `${BASE_URL}/recuperar-password/${token}`;

  await getResend().emails.send({
    from: FROM,
    to,
    subject: "Recuperação de palavra-passe — OpenCondo",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
        <h2 style="margin:0 0 8px">Recuperar palavra-passe</h2>
        <p style="color:#555;margin:0 0 24px">
          Recebemos um pedido para redefinir a palavra-passe da sua conta OpenCondo.
          Clique no botão abaixo para criar uma nova palavra-passe.
          O link é válido durante <strong>1 hora</strong>.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:8px;font-weight:600">
          Redefinir palavra-passe
        </a>
        <p style="color:#888;font-size:13px;margin:24px 0 0">
          Se não solicitou esta ação, pode ignorar este email.
          A sua palavra-passe não será alterada.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#aaa;font-size:12px;margin:0">OpenCondo · Gestão de condomínios</p>
      </div>
    `,
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
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 16px">
        <h2 style="margin:0 0 8px">Foi convidado para ${condominiumName}</h2>
        <p style="color:#555;margin:0 0 8px">
          Foi convidado para aceder ao condomínio <strong>${condominiumName}</strong>
          na plataforma OpenCondo como <strong>${roleLabel}</strong>.
        </p>
        <p style="color:#555;margin:0 0 24px">
          Clique no botão abaixo para criar a sua conta ou iniciar sessão e aceitar o convite.
          O convite é válido durante <strong>7 dias</strong>.
        </p>
        <a href="${joinUrl}"
           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                  padding:12px 24px;border-radius:8px;font-weight:600">
          Aceitar convite
        </a>
        <p style="color:#888;font-size:13px;margin:24px 0 0">
          Em alternativa, aceda a <a href="${BASE_URL}/entrar" style="color:#2563eb">${BASE_URL}/entrar</a>
          e introduza o código: <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${token}</code>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#aaa;font-size:12px;margin:0">OpenCondo · Gestão de condomínios</p>
      </div>
    `,
  });
}
