import Link from "next/link";
import { createHash } from "crypto";
import { db } from "@/lib/db";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const user = await db.user.findFirst({
    where: {
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              OC
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Link inválido ou expirado
            </h1>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-4 text-sm text-muted-foreground">
              Este link de verificação é inválido ou já expirou.
              Inicie sessão para solicitar um novo email de verificação.
            </p>
            <Link
              href="/login"
              className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Iniciar sessão
            </Link>
          </div>
        </div>
      </div>
    );
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerified: new Date(),
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            OC
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Email verificado
          </h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">
            O seu endereço de email foi verificado com sucesso.
          </div>
          <Link
            href="/login"
            className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Continuar para o OpenCondo
          </Link>
        </div>
      </div>
    </div>
  );
}
