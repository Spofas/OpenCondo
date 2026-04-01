"use client";

import { useRouter } from "next/navigation";
import { Download, ScrollText } from "lucide-react";

export interface AtaData {
  id: string;
  number: number;
  status: string;
  content: string;
  meetingDate: string;
  meetingType: string;
  meetingLocation: string;
}

const typeLabels: Record<string, string> = {
  ORDINARIA: "Ordinária",
  EXTRAORDINARIA: "Extraordinária",
};

export function AtasPageClient({
  atas,
  page,
  totalPages,
  totalAtas,
}: {
  atas: AtaData[];
  page: number;
  totalPages: number;
  totalAtas: number;
}) {
  const router = useRouter();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Atas</h1>
        <p className="text-sm text-muted-foreground">
          Atas das assembleias de condóminos
        </p>
      </div>

      {atas.length === 0 && page === 1 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <ScrollText size={40} strokeWidth={1.5} />
            <p className="text-sm">Nenhuma ata registada</p>
            <p className="text-xs">
              Redija atas a partir da página de assembleias
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {atas.map((ata) => (
            <div
              key={ata.id}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Ata n.º {ata.number}
                </span>
                <span className="text-xs text-muted-foreground">
                  Assembleia {typeLabels[ata.meetingType] || ata.meetingType} —{" "}
                  {new Date(ata.meetingDate).toLocaleDateString("pt-PT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ata.meetingLocation}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    ata.status === "FINAL"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {ata.status === "FINAL" ? "Final" : "Rascunho"}
                </span>
                <a
                  href={`/api/atas/${ata.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <Download size={12} />
                  PDF
                </a>
              </div>
              <div className="whitespace-pre-wrap rounded-lg bg-muted/30 p-4 text-sm text-foreground">
                {ata.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
          <span className="text-sm text-muted-foreground">
            {totalAtas} ata{totalAtas !== 1 ? "s" : ""} · Página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => router.push(`?page=${page - 1}`)}
              disabled={page <= 1}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => router.push(`?page=${page + 1}`)}
              disabled={page >= totalPages}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Seguinte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
