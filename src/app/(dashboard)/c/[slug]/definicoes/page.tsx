import { Suspense } from "react";
import { db } from "@/lib/db";
import { requireMembershipWithCondo } from "@/lib/auth/require-membership";
import { InviteManager } from "./invite-manager";
import { UnitManager } from "./unit-manager";
import { CondoInfoCard } from "./condo-info-card";

function SettingsSkeleton() {
  return (
    <div className="grid gap-6 animate-pulse">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-40 rounded bg-muted mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-32 rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div>
                <div className="h-4 w-28 rounded bg-muted mb-1" />
                <div className="h-3 w-40 rounded bg-muted" />
              </div>
              <div className="h-5 w-20 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function SettingsContent({
  condominiumId,
  isAdmin,
  condo,
}: {
  condominiumId: string;
  isAdmin: boolean;
  condo: { id: string; name: string; address: string; city: string | null; nif: string | null };
}) {
  // Get members of this condominium
  const members = await db.membership.findMany({
    where: { condominiumId, isActive: true },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  // Get units for this condominium — sorted by floor ASC (nulls last), then identifier
  const units = await db.unit.findMany({
    where: { condominiumId },
    include: {
      owner: { select: { name: true } },
      tenant: { select: { name: true } },
    },
    orderBy: [{ floor: "asc" }, { identifier: "asc" }],
  });

  // Get invites (only if admin)
  const invites = isAdmin
    ? await db.invite.findMany({
        where: { condominiumId },
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
    <div className="grid gap-6">
      {/* Condominium Info — editable by admin */}
      {isAdmin ? (
        <CondoInfoCard condo={condo} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Dados do condomínio
          </h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Nome:</span>{" "}
              {condo.name}
            </p>
            <p>
              <span className="text-muted-foreground">Morada:</span>{" "}
              {condo.address}
            </p>
            {condo.city && (
              <p>
                <span className="text-muted-foreground">Cidade:</span>{" "}
                {condo.city}
              </p>
            )}
            {condo.nif && (
              <p>
                <span className="text-muted-foreground">NIF:</span>{" "}
                {condo.nif}
              </p>
            )}
          </div>
        </div>
      )}

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

      {/* Unit management — admin only */}
      {isAdmin && (
        <UnitManager
          condominiumId={condominiumId}
          units={units.map((u) => ({
            id: u.id,
            identifier: u.identifier,
            floor: u.floor,
            typology: u.typology,
            permilagem: u.permilagem,
            ownerName: u.owner?.name || null,
            ownerId: u.ownerId,
            tenantName: u.tenant?.name || null,
            tenantId: u.tenantId,
          }))}
          members={members.map((m) => ({
            userId: m.user.id,
            userName: m.user.name,
            userEmail: m.user.email,
          }))}
        />
      )}

      {/* Invite section — admin only */}
      {isAdmin && (
        <InviteManager
          condominiumId={condominiumId}
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
  );
}

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembershipWithCondo(slug);

  const isAdmin = membership.role === "ADMIN";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Definições de Condomínio</h1>
        <p className="text-sm text-muted-foreground">
          Configurações do condomínio e membros
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <SettingsContent
          condominiumId={membership.condominiumId}
          isAdmin={isAdmin}
          condo={{
            id: membership.condominiumId,
            name: membership.condominium.name,
            address: membership.condominium.address,
            city: membership.condominium.city ?? null,
            nif: membership.condominium.nif ?? null,
          }}
        />
      </Suspense>
    </div>
  );
}
