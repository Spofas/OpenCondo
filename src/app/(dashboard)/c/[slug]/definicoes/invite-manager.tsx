"use client";

import { useState } from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import { createInvite } from "../../../actions";

interface InviteData {
  id: string;
  token: string;
  role: string;
  email: string | null;
  expiresAt: string;
  usedAt: string | null;
  usedByUser: { name: string; email: string } | null;
}

interface InviteManagerProps {
  condominiumId: string;
  invites: InviteData[];
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OWNER: "Proprietário",
  TENANT: "Inquilino",
};

export function InviteManager({ condominiumId, invites }: InviteManagerProps) {
  const [role, setRole] = useState<"OWNER" | "TENANT">("OWNER");
  const [email, setEmail] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    setError("");
    setIsCreating(true);
    setNewToken(null);

    const result = await createInvite(condominiumId, {
      role,
      email: email.trim() || undefined,
    });

    setIsCreating(false);

    if (!result.success) {
      setError(result.error ?? "Erro desconhecido");
      return;
    }

    if (result.token) {
      setNewToken(result.token as string);
      setEmail("");
    }
  }

  function copyToken(token: string) {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const now = new Date();

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-card-foreground">
        Convites
      </h2>

      {/* Create invite form */}
      <div className="mb-6 rounded-lg border border-dashed border-border p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <UserPlus size={16} />
          Criar novo convite
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Papel
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "OWNER" | "TENANT")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="OWNER">Proprietário</option>
              <option value="TENANT">Inquilino</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              Email (opcional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="pessoa@email.pt"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isCreating ? "A criar..." : "Criar convite"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-500">{error}</p>
        )}

        {newToken && (
          <div className="mt-3 rounded-lg bg-green-50 p-3">
            <p className="mb-1 text-xs font-medium text-green-800">
              Convite criado! Partilhe este código:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white px-2 py-1 text-sm font-mono text-green-900 border border-green-200">
                {newToken}
              </code>
              <button
                onClick={() => copyToken(newToken)}
                className="rounded-lg p-2 text-green-700 hover:bg-green-100 transition-colors"
                title="Copiar"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <p className="mt-1 text-xs text-green-600">
              Válido por 7 dias.
            </p>
          </div>
        )}
      </div>

      {/* Existing invites */}
      {invites.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Convites anteriores
          </h3>
          <div className="divide-y divide-border rounded-lg border border-border">
            {invites.map((inv) => {
              const expired = new Date(inv.expiresAt) < now;
              const used = !!inv.usedAt;

              return (
                <div key={inv.id} className="flex items-center justify-between px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-muted-foreground">
                        {inv.token.slice(0, 12)}...
                      </code>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                        {roleLabels[inv.role] ?? inv.role}
                      </span>
                    </div>
                    {inv.email && (
                      <p className="text-xs text-muted-foreground">
                        Para: {inv.email}
                      </p>
                    )}
                    {used && inv.usedByUser && (
                      <p className="text-xs text-green-600">
                        Usado por {inv.usedByUser.name}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      used
                        ? "bg-green-100 text-green-700"
                        : expired
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {used ? "Usado" : expired ? "Expirado" : "Ativo"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
