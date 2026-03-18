import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { InviteManager } from "./invite-manager";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Get current condo from cookie
  const cookieStore = await cookies();
  const selectedCondoId = cookieStore.get("activeCondominiumId")?.value;

  const membership = selectedCondoId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId: selectedCondoId,
          },
        },
        include: { condominium: true },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: { condominium: true },
      });

  if (!membership) redirect("/iniciar");

  // Get members of this condominium
  const members = await db.membership.findMany({
    where: { condominiumId: membership.condominiumId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  // Get invites (only if admin)
  const invites =
    membership.role === "ADMIN"
      ? await db.invite.findMany({
          where: { condominiumId: membership.condominiumId },
          include: {
            usedByUser: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : [];

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    OWNER: "Proprietário",
    TENANT: "Inquilino",
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Definições</h1>
        <p className="text-sm text-muted-foreground">
          Configurações do condomínio e conta
        </p>
      </div>

      <div className="grid gap-6">
        {/* Condominium Info */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Dados do condomínio
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nome:</span>{" "}
              {membership.condominium.name}
            </p>
            <p>
              <span className="text-muted-foreground">Morada:</span>{" "}
              {membership.condominium.address}
            </p>
            {membership.condominium.city && (
              <p>
                <span className="text-muted-foreground">Cidade:</span>{" "}
                {membership.condominium.city}
              </p>
            )}
            {membership.condominium.nif && (
              <p>
                <span className="text-muted-foreground">NIF:</span>{" "}
                {membership.condominium.nif}
              </p>
            )}
          </div>
        </div>

        {/* Members list */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              Membros ({members.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {m.user.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.user.email}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {roleLabels[m.role] ?? m.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Invite section — admin only */}
        {membership.role === "ADMIN" && (
          <InviteManager
            condominiumId={membership.condominiumId}
            invites={invites.map((inv) => ({
              id: inv.id,
              token: inv.token,
              role: inv.role,
              email: inv.email,
              expiresAt: inv.expiresAt.toISOString(),
              usedAt: inv.usedAt?.toISOString() ?? null,
              usedByUser: inv.usedByUser,
            }))}
          />
        )}
      </div>
    </div>
  );
}
