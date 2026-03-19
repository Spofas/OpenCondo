import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { ScrollText } from "lucide-react";

export default async function AtasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

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
