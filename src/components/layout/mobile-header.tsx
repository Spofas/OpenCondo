"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { switchCondominium } from "@/app/(dashboard)/actions";
import Link from "next/link";

interface MembershipInfo {
  condominiumId: string;
  condominiumName: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OWNER: "Proprietário",
  TENANT: "Inquilino",
};

export function MobileHeader({
  condominiumName,
  currentCondominiumId,
  memberships,
}: {
  condominiumName: string;
  currentCondominiumId: string;
  memberships: MembershipInfo[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const hasMultiple = memberships.length > 1;

  async function handleSwitch(condominiumId: string) {
    setOpen(false);
    await switchCondominium(condominiumId);
    router.refresh();
  }

  return (
    <div className="sticky top-0 z-30 border-b border-border bg-card lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            OC
          </div>
          {hasMultiple ? (
            <button
              onClick={() => setOpen(!open)}
              className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
            >
              <span className="max-w-[200px] truncate">{condominiumName}</span>
              <ChevronDown
                size={14}
                className={cn(
                  "text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>
          ) : (
            <span className="max-w-[200px] truncate text-sm font-semibold text-foreground">
              {condominiumName}
            </span>
          )}
        </div>
      </div>

      {/* Condominium switcher dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-2 right-2 top-full z-30 mt-1 rounded-lg border border-border bg-card py-1 shadow-lg">
            {memberships.map((m) => (
              <button
                key={m.condominiumId}
                onClick={() => handleSwitch(m.condominiumId)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-secondary",
                  m.condominiumId === currentCondominiumId && "bg-primary/5 font-medium"
                )}
              >
                <Building2 size={14} className="shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-foreground">{m.condominiumName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[m.role] ?? m.role}</p>
                </div>
              </button>
            ))}
            <div className="border-t border-border mt-1 pt-1">
              <Link
                href="/iniciar"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
              >
                <Plus size={14} />
                Adicionar condomínio
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
