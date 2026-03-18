"use client";

import Link from "next/link";
import { Building2, UserPlus, ArrowRight } from "lucide-react";

export default function StartPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            OC
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo ao OpenCondo
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            O que pretende fazer?
          </p>
        </div>

        <div className="space-y-4">
          {/* Create new condominium */}
          <Link
            href="/onboarding"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                Criar um condomínio
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Configure um novo condomínio e torne-se administrador
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
            />
          </Link>

          {/* Join existing condominium */}
          <Link
            href="/entrar"
            className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <UserPlus size={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">
                Juntar-se a um condomínio
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Utilize um código de convite do administrador
              </p>
            </div>
            <ArrowRight
              size={18}
              className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
            />
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Pode sempre adicionar mais condomínios mais tarde.
        </p>
      </div>
    </div>
  );
}
