"use client";

import { useState } from "react";
import {
  UserCircle,
  Home,
  Wallet,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface UnitInfo {
  id: string;
  identifier: string;
  floor: number | null;
  typology: string | null;
  permilagem: number;
  isOwner: boolean;
}

interface QuotaInfo {
  id: string;
  unitIdentifier: string;
  period: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paymentDate: string | null;
  paymentMethod: string | null;
}

interface Summary {
  pendingAmount: number;
  overdueAmount: number;
  paidAmount: number;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  transferencia: "Transferência",
  numerario: "Numerário",
  cheque: "Cheque",
  mbway: "MB WAY",
  multibanco: "Multibanco",
  outro: "Outro",
};

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  OWNER: "Proprietário",
  TENANT: "Inquilino",
};

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle size={12} />
          Pago
        </span>
      );
    case "OVERDUE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <AlertTriangle size={12} />
          Em atraso
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
          <Clock size={12} />
          Pendente
        </span>
      );
  }
}

export function MyAccountClient({
  userName,
  userEmail,
  condominiumName,
  role,
  units,
  quotas,
  summary,
}: {
  userName: string;
  userEmail: string;
  condominiumName: string;
  role: string;
  units: UnitInfo[];
  quotas: QuotaInfo[];
  summary: Summary;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayQuotas = showAll ? quotas : quotas.slice(0, 12);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Minha conta</h1>
        <p className="text-sm text-muted-foreground">
          Informações pessoais e estado financeiro
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile card */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <UserCircle size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{userName}</h2>
              <p className="text-sm text-muted-foreground">{userEmail}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {roleLabels[role] || role}
                </span>
                <span className="text-xs text-muted-foreground">
                  {condominiumName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout — visible on mobile where sidebar is hidden */}
        <div className="lg:hidden">
          <button
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
          >
            <LogOut size={16} />
            Terminar sessão
          </button>
        </div>

        {/* Units */}
        {units.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
              <Home size={18} />
              As minhas frações
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="rounded-lg border border-border/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-foreground">
                      {unit.identifier}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {unit.isOwner ? "Proprietário" : "Inquilino"}
                    </span>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    {unit.floor !== null && (
                      <span>Piso {unit.floor === 0 ? "R/C" : `${unit.floor}.º`}</span>
                    )}
                    {unit.typology && <span>{unit.typology}</span>}
                    <span>{unit.permilagem}‰</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financial summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Pendente</p>
            <p className="mt-1 text-xl font-semibold text-amber-600">
              {formatCurrency(summary.pendingAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Em atraso</p>
            <p className="mt-1 text-xl font-semibold text-red-600">
              {formatCurrency(summary.overdueAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total pago</p>
            <p className="mt-1 text-xl font-semibold text-green-600">
              {formatCurrency(summary.paidAmount)}
            </p>
          </div>
        </div>

        {/* Quota history */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-card-foreground">
            <Wallet size={18} />
            Histórico de quotas
          </h2>

          {quotas.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              {units.length === 0
                ? "Nenhuma fração associada à sua conta"
                : "Sem quotas registadas para as suas frações"}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="space-y-3 md:hidden">
                {displayQuotas.map((q) => (
                  <div key={q.id} className="rounded-lg border border-border/50 bg-background p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{q.unitIdentifier}</span>
                        <span className="text-xs text-muted-foreground">{formatPeriod(q.period)}</span>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {q.status === "PAID" && q.paymentDate
                          ? `Pago ${new Date(q.paymentDate).toLocaleDateString("pt-PT")}`
                          : `Vence ${new Date(q.dueDate).toLocaleDateString("pt-PT")}`}
                      </span>
                      <span className="font-medium text-foreground">{formatCurrency(q.amount)}</span>
                    </div>
                    {q.status === "PAID" && (
                      <div className="mt-2 flex justify-end">
                        <a
                          href={`/api/receipts/${q.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          <Download size={12} />
                          Recibo
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Período</th>
                      <th className="pb-2 font-medium">Fração</th>
                      <th className="pb-2 font-medium">Valor</th>
                      <th className="pb-2 font-medium">Estado</th>
                      <th className="pb-2 font-medium">Pagamento</th>
                      <th className="pb-2 text-right font-medium">Recibo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayQuotas.map((q) => (
                      <tr key={q.id} className="border-b border-border/50">
                        <td className="py-2.5 text-foreground">
                          {formatPeriod(q.period)}
                        </td>
                        <td className="py-2.5 font-medium text-foreground">
                          {q.unitIdentifier}
                        </td>
                        <td className="py-2.5 text-foreground">
                          {formatCurrency(q.amount)}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={q.status} />
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {q.status === "PAID" && q.paymentDate ? (
                            <span className="text-xs">
                              {new Date(q.paymentDate).toLocaleDateString("pt-PT")}
                              {q.paymentMethod && (
                                <>
                                  {" · "}
                                  {PAYMENT_METHOD_LABELS[q.paymentMethod] || q.paymentMethod}
                                </>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs">
                              Vence {new Date(q.dueDate).toLocaleDateString("pt-PT")}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          {q.status === "PAID" && (
                            <a
                              href={`/api/receipts/${q.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                              title="Descarregar recibo"
                            >
                              <Download size={12} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {quotas.length > 12 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  {showAll ? (
                    <>
                      <ChevronUp size={14} />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} />
                      Mostrar todas ({quotas.length})
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
