"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
  Trash2,
  CheckCircle,
  Undo2,
  Clock,
  AlertTriangle,
  Download,
} from "lucide-react";
import { deleteQuotasByPeriod } from "./actions";
import { PaymentModal } from "./payment-modal";
import type { QuotaData } from "./quota-page-client";
import { PAYMENT_METHODS } from "@/lib/validators/quota";

function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function getStatusBadge(status: "PENDING" | "PAID" | "OVERDUE") {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle size={12} />
          Pago
        </span>
      );
    case "OVERDUE":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <AlertTriangle size={12} />
          Em atraso
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          <Clock size={12} />
          Pendente
        </span>
      );
  }
}

function getPaymentMethodLabel(method: string | null): string {
  if (!method) return "—";
  const found = PAYMENT_METHODS.find((m) => m.value === method);
  return found ? found.label : method;
}

export function QuotaList({
  quotas,
  isAdmin,
}: {
  quotas: QuotaData[];
  isAdmin: boolean;
}) {
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(
    // Auto-expand the first period
    quotas.length > 0 ? quotas[0].period : null
  );
  const [payingQuota, setPayingQuota] = useState<QuotaData | null>(null);
  const [confirmDeletePeriod, setConfirmDeletePeriod] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // Group quotas by period
  const groupedByPeriod = new Map<string, QuotaData[]>();
  for (const quota of quotas) {
    const existing = groupedByPeriod.get(quota.period) || [];
    existing.push(quota);
    groupedByPeriod.set(quota.period, existing);
  }

  // Sort periods descending
  const periods = Array.from(groupedByPeriod.keys()).sort((a, b) =>
    b.localeCompare(a)
  );

  async function handleDeletePeriod(period: string) {
    setActionError("");
    const result = await deleteQuotasByPeriod(period);
    if (result.error) {
      setActionError(result.error);
    }
    setConfirmDeletePeriod(null);
  }

  if (quotas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Wallet size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhuma quota registada</p>
          <p className="text-xs">
            Gere as quotas definindo o valor mensal e o período
          </p>
        </div>
      </div>
    );
  }

  // Summary stats
  const totalPending = quotas
    .filter((q) => q.status === "PENDING")
    .reduce((sum, q) => sum + q.amount, 0);
  const totalOverdue = quotas
    .filter((q) => q.status === "OVERDUE")
    .reduce((sum, q) => sum + q.amount, 0);
  const totalPaid = quotas
    .filter((q) => q.status === "PAID")
    .reduce((sum, q) => sum + q.amount, 0);

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendente</p>
          <p className="mt-1 text-xl font-semibold text-amber-600">
            €{totalPending.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Em atraso</p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            €{totalOverdue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Recebido</p>
          <p className="mt-1 text-xl font-semibold text-green-600">
            €{totalPaid.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Quotas grouped by period */}
      <div className="space-y-4">
        {periods.map((period) => {
          const periodQuotas = groupedByPeriod.get(period)!;
          const isExpanded = expandedPeriod === period;
          const periodTotal = periodQuotas.reduce((sum, q) => sum + q.amount, 0);
          const paidCount = periodQuotas.filter((q) => q.status === "PAID").length;
          const overdueCount = periodQuotas.filter((q) => q.status === "OVERDUE").length;

          return (
            <div
              key={period}
              className="rounded-xl border border-border bg-card"
            >
              {/* Period header */}
              <button
                onClick={() =>
                  setExpandedPeriod(isExpanded ? null : period)
                }
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {formatPeriod(period)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      €
                      {periodTotal.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                      })}
                      {" · "}
                      {periodQuotas.length} {periodQuotas.length !== 1 ? "frações" : "fração"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {paidCount > 0 && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {paidCount} pago{paidCount !== 1 ? "s" : ""}
                      </span>
                    )}
                    {overdueCount > 0 && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {overdueCount} em atraso
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={20} className="text-muted-foreground" />
                )}
              </button>

              {/* Expanded: quota details per unit */}
              {isExpanded && (
                <div className="border-t border-border px-6 py-4 overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Fração</th>
                        <th className="pb-2 font-medium">Valor</th>
                        <th className="pb-2 font-medium">Vencimento</th>
                        <th className="pb-2 font-medium">Estado</th>
                        <th className="pb-2 font-medium">Pagamento</th>
                        {isAdmin && (
                          <th className="pb-2 text-right font-medium">
                            Ações
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {periodQuotas.map((quota) => (
                        <tr
                          key={quota.id}
                          className="border-b border-border/50"
                        >
                          <td className="py-2.5 font-medium text-foreground">
                            {quota.unitIdentifier}
                          </td>
                          <td className="py-2.5 text-foreground">
                            €
                            {quota.amount.toLocaleString("pt-PT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {new Date(quota.dueDate).toLocaleDateString(
                              "pt-PT"
                            )}
                          </td>
                          <td className="py-2.5">
                            {getStatusBadge(quota.status)}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {quota.status === "PAID" && quota.paymentDate ? (
                              <span className="text-xs">
                                {new Date(
                                  quota.paymentDate
                                ).toLocaleDateString("pt-PT")}
                                {" · "}
                                {getPaymentMethodLabel(quota.paymentMethod)}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          {isAdmin && (
                            <td className="py-2.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {quota.status !== "PAID" ? (
                                  <button
                                    onClick={() => setPayingQuota(quota)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                                  >
                                    <CheckCircle size={12} />
                                    Pagar
                                  </button>
                                ) : (
                                  <>
                                    <a
                                      href={`/api/receipts/${quota.id}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                                      title="Descarregar recibo"
                                    >
                                      <Download size={12} />
                                      Recibo
                                    </a>
                                    <button
                                      onClick={() => {
                                        import("./actions").then(({ undoPayment }) =>
                                          undoPayment(quota.id)
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                      <Undo2 size={12} />
                                      Anular
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Period actions (admin only) */}
                  {isAdmin && (
                    <div className="mt-4 border-t border-border pt-4">
                      {confirmDeletePeriod === period ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Eliminar quotas não pagas de {formatPeriod(period)}?
                          </span>
                          <button
                            onClick={() => handleDeletePeriod(period)}
                            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90"
                          >
                            Sim, eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDeletePeriod(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeletePeriod(period)}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                          Eliminar quotas não pagas
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {payingQuota && (
        <PaymentModal
          quota={payingQuota}
          onClose={() => setPayingQuota(null)}
        />
      )}
    </>
  );
}
