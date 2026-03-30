"use client";

import {
  AlertTriangle,
  Clock,
  Users,
  TrendingDown,
} from "lucide-react";
import type { DebtorSummary } from "@/lib/debtor-calculations";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

function AgingBar({ current, o30, o60, o90, o90p, total }: {
  current: number; o30: number; o60: number; o90: number; o90p: number; total: number;
}) {
  if (total === 0) return null;
  const pct = (v: number) => `${Math.max((v / total) * 100, 0)}%`;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      {current > 0 && <div className="bg-blue-400" style={{ width: pct(current) }} />}
      {o30 > 0 && <div className="bg-amber-400" style={{ width: pct(o30) }} />}
      {o60 > 0 && <div className="bg-orange-500" style={{ width: pct(o60) }} />}
      {o90 > 0 && <div className="bg-red-500" style={{ width: pct(o90) }} />}
      {o90p > 0 && <div className="bg-red-800" style={{ width: pct(o90p) }} />}
    </div>
  );
}

export function DebtorClient({ summary, hideTitle }: { summary: DebtorSummary; hideTitle?: boolean }) {
  return (
    <div>
      {!hideTitle && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Devedores</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhamento de dívidas por fração
          </p>
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-red-500" />
            <p className="text-xs text-muted-foreground">Dívida total</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {formatCurrency(summary.totalDebt)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-xs text-muted-foreground">Total em atraso</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-amber-600">
            {formatCurrency(summary.totalOverdue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <p className="text-xs text-muted-foreground">Frações com dívida</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {summary.unitsWithDebt}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-red-500" />
            <p className="text-xs text-muted-foreground">Com atraso</p>
          </div>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {summary.unitsWithOverdue}
          </p>
        </div>
      </div>

      {/* Aging legend */}
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-400" />
          Corrente
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-400" />
          1-30 dias
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          31-60 dias
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          61-90 dias
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-800" />
          90+ dias
        </span>
      </div>

      {/* Debtor table */}
      {summary.debtors.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Users size={40} strokeWidth={1.5} />
            <p className="text-sm">Sem dívidas pendentes</p>
            <p className="text-xs">Todas as quotas estão pagas</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-6 py-3 font-medium">Fração</th>
                <th className="px-6 py-3 font-medium">Proprietário</th>
                <th className="px-6 py-3 font-medium">Quotas</th>
                <th className="px-6 py-3 font-medium w-40">Aging</th>
                <th className="px-6 py-3 text-right font-medium">Corrente</th>
                <th className="px-6 py-3 text-right font-medium">1-30d</th>
                <th className="px-6 py-3 text-right font-medium">31-60d</th>
                <th className="px-6 py-3 text-right font-medium">61-90d</th>
                <th className="px-6 py-3 text-right font-medium">90d+</th>
                <th className="px-6 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {summary.debtors.map((d) => (
                <tr key={d.unitId} className="border-b border-border/50">
                  <td className="px-6 py-3 font-medium text-foreground">
                    {d.unitIdentifier}
                  </td>
                  <td className="px-6 py-3">
                    <div className="text-foreground">
                      {d.ownerName || "—"}
                    </div>
                    {d.ownerEmail && (
                      <div className="text-xs text-muted-foreground">
                        {d.ownerEmail}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {d.unpaidCount}
                  </td>
                  <td className="px-6 py-3">
                    <AgingBar
                      current={d.current}
                      o30={d.overdue30}
                      o60={d.overdue60}
                      o90={d.overdue90}
                      o90p={d.overdue90Plus}
                      total={d.totalDebt}
                    />
                  </td>
                  <td className="px-6 py-3 text-right text-blue-600">
                    {d.current > 0 ? formatCurrency(d.current) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-amber-600">
                    {d.overdue30 > 0 ? formatCurrency(d.overdue30) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-orange-600">
                    {d.overdue60 > 0 ? formatCurrency(d.overdue60) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-red-600">
                    {d.overdue90 > 0 ? formatCurrency(d.overdue90) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right text-red-800">
                    {d.overdue90Plus > 0 ? formatCurrency(d.overdue90Plus) : "—"}
                  </td>
                  <td className="px-6 py-3 text-right font-semibold text-foreground">
                    {formatCurrency(d.totalDebt)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-semibold">
                <td className="px-6 py-3 text-foreground" colSpan={3}>
                  Total ({summary.unitsWithDebt} frações)
                </td>
                <td className="px-6 py-3" />
                <td className="px-6 py-3 text-right text-blue-600">
                  {formatCurrency(
                    summary.debtors.reduce((s, d) => s + d.current, 0)
                  )}
                </td>
                <td className="px-6 py-3 text-right text-amber-600">
                  {formatCurrency(
                    summary.debtors.reduce((s, d) => s + d.overdue30, 0)
                  )}
                </td>
                <td className="px-6 py-3 text-right text-orange-600">
                  {formatCurrency(
                    summary.debtors.reduce((s, d) => s + d.overdue60, 0)
                  )}
                </td>
                <td className="px-6 py-3 text-right text-red-600">
                  {formatCurrency(
                    summary.debtors.reduce((s, d) => s + d.overdue90, 0)
                  )}
                </td>
                <td className="px-6 py-3 text-right text-red-800">
                  {formatCurrency(
                    summary.debtors.reduce((s, d) => s + d.overdue90Plus, 0)
                  )}
                </td>
                <td className="px-6 py-3 text-right text-foreground">
                  {formatCurrency(summary.totalDebt)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
