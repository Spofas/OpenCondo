"use client";

import Link from "next/link";
import { useState } from "react";
import { requestPasswordReset } from "./actions";

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestPasswordReset(email.trim().toLowerCase());

    setLoading(false);
    setSubmitted(true);

    if (result.devToken) {
      setDevLink(`/recuperar-password/${result.devToken}`);
    }
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
            Recuperar palavra-passe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Introduza o seu email para receber um link de recuperação
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {!submitted ? (
            <form onSubmit={onSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="o.seu@email.pt"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "A enviar..." : "Enviar link de recuperação"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                Se existir uma conta com esse email, receberá um link de
                recuperação em breve.
              </div>

              {devLink && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
                  <p className="mb-2 font-semibold text-amber-800">
                    Modo de desenvolvimento
                  </p>
                  <p className="mb-3 text-amber-700">
                    Em produção, este link seria enviado por email. Use-o
                    diretamente:
                  </p>
                  <Link
                    href={devLink}
                    className="block break-all rounded bg-white px-3 py-2 font-mono text-xs text-primary underline hover:no-underline"
                  >
                    {typeof window !== "undefined"
                      ? `${window.location.origin}${devLink}`
                      : devLink}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline">
            Voltar ao início de sessão
          </Link>
        </p>
      </div>
    </div>
  );
}
