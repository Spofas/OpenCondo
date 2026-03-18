"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ticket } from "lucide-react";
import { joinWithInvite } from "./actions";

export default function JoinCondoPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const trimmed = code.trim();
    if (!trimmed) {
      setError("Introduza o código de convite");
      return;
    }

    setIsSubmitting(true);
    const result = await joinWithInvite(trimmed);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-green-600">
            <Ticket size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Juntar-se a um condomínio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Introduza o código de convite fornecido pelo administrador
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Código de convite
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Cole aqui o código de convite"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "A verificar..." : "Juntar-se"}
            </button>
          </form>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/iniciar"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
