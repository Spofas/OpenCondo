import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { Download, ScrollText } from "lucide-react";

export default async function AtasPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  const atas = await db.ata.findMany({
    where: { meeting: { condominiumId: membership.condominiumId } },
    include: {
      meeting: { select: { date: true, type: true, location: true } },
    },
    orderBy: { number: "desc" },
  });

  if (atas.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Atas</h1>
          <p className="text-sm text-muted-foreground">
            Atas das assembleias de condóminos
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <ScrollText size={40} strokeWidth={1.5} />
            <p className="text-sm">Nenhuma ata registada</p>
            <p className="text-xs">
              Redija atas a partir da página de assembleias
            </p>
          </div>
        </div>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    ORDINARIA: "Ordinária",
    EXTRAORDINARIA: "Extraordinária",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Atas</h1>
        <p className="text-sm text-muted-foreground">
          Atas das assembleias de condóminos
        </p>
      </div>

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
                Assembleia {typeLabels[ata.meeting.type] || ata.meeting.type} —{" "}
                {new Date(ata.meeting.date).toLocaleDateString("pt-PT", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                {ata.meeting.location}
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
    </div>
  );
}
