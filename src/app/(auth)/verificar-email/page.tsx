"use client";

import Link from "next/link";
import { useState } from "react";
import { resendVerificationEmail } from "./actions";

export default function VerifyEmailPendingPage() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    setSending(true);
    setError("");
    setSent(false);

    const result = await resendVerificationEmail();

    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
    setSending(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
              OC
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Verifique o seu email
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enviámos um email de verificação para o seu endereço
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="mb-4 text-sm text-muted-foreground">
            Para continuar a usar o OpenCondo, por favor verifique o seu
            endereço de email clicando no link que enviámos.
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {sent && (
            <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Email de verificação reenviado. Verifique a sua caixa de entrada.
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={sending}
            className="mb-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {sending ? "A enviar..." : "Reenviar email de verificação"}
          </button>

          <Link
            href="/login"
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Voltar ao início de sessão
          </Link>
        </div>
      </div>
    </div>
  );
}
