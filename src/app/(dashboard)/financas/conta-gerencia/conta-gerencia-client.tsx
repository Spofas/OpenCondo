"use client";

import { useState } from "react";
import {
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
} from "lucide-react";
import type { ContaGerenciaReport } from "@/lib/conta-gerencia";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

export function ContaGerenciaClient({
  report,
  availableYears,
  defaultYear,
  isAdmin,
}: {
  report: ContaGerenciaReport;
  availableYears: number[];
  defaultYear: number;
  isAdmin: boolean;
}) {
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  // The report is server-rendered for the default year.
  // Year switching triggers PDF download from the API route.
  const r = report;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conta de gerência</h1>
          <p className="text-sm text-muted-foreground">
            Relatório financeiro anual do condomínio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
            {availableYears.length === 0 && (
              <option value={new Date().getFullYear()}>
                {new Date().getFullYear()}
              </option>
            )}
          </select>
          {isAdmin && (
            <a
              href={`/api/conta-gerencia?year=${selectedYear}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Download size={16} />
              Exportar PDF
            </a>
          )}
        </div>
      </div>

      {/* No data */}
      {r.totalQuotasGenerated === 0 && r.totalExpenses === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText size={40} strokeWidth={1.5} />
            <p className="text-sm">Sem dados financeiros para {r.year}</p>
            <p className="text-xs">
              Gere quotas e registe despesas para visualizar o relatório
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryCard
              label="Receitas cobradas"
              value={formatCurrency(r.totalQuotasPaid)}
              icon={<TrendingUp size={18} className="text-green-600" />}
              color="text-green-600"
            />
            <SummaryCard
              label="Total despesas"
              value={formatCurrency(r.totalExpenses)}
              icon={<TrendingDown size={18} className="text-red-600" />}
              color="text-red-600"
            />
            <SummaryCard
              label="Saldo"
              value={formatCurrency(r.netBalance)}
              icon={
                r.netBalance >= 0 ? (
                  <CheckCircle size={18} className="text-green-600" />
                ) : (
                  <AlertTriangle size={18} className="text-red-600" />
                )
              }
              color={r.netBalance >= 0 ? "text-green-600" : "text-red-600"}
            />
            <SummaryCard
              label="Taxa de cobrança"
              value={`${r.collectionRate}%`}
              icon={<PieChart size={18} className="text-primary" />}
              color="text-primary"
            />
          </div>

          {/* Income section */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Receitas (Quotas)
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total gerado" value={formatCurrency(r.totalQuotasGenerated)} />
              <Stat
                label="Cobrado"
                value={formatCurrency(r.totalQuotasPaid)}
                color="text-green-600"
              />
              <Stat
                label="Pendente"
                value={formatCurrency(r.totalQuotasPending)}
                color="text-amber-600"
              />
              <Stat
                label="Em atraso"
                value={formatCurrency(r.totalQuotasOverdue)}
                color="text-red-600"
              />
            </div>

            {/* Collection rate bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Taxa de cobrança</span>
                <span>{r.collectionRate}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all"
                  style={{ width: `${Math.min(r.collectionRate, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expenses by category */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Despesas por categoria
            </h2>
            {r.expensesByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma despesa registada para {r.year}
              </p>
            ) : (
              <div className="space-y-3">
                {r.expensesByCategory.map((cat) => {
                  const pct =
                    r.totalExpenses > 0
                      ? Math.round((cat.amount / r.totalExpenses) * 100)
                      : 0;
                  return (
                    <div key={cat.category}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{cat.category}</span>
                        <span className="font-medium text-foreground">
                          {formatCurrency(cat.amount)}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-primary/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
                  <span className="text-foreground">Total</span>
                  <span className="text-foreground">
                    {formatCurrency(r.totalExpenses)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Budget variance */}
          {r.budgetLines.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <h2 className="mb-4 px-6 pt-6 text-lg font-semibold text-card-foreground">
                Orçamento vs. Realizado
              </h2>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Rubrica</th>
                      <th className="pb-2 text-right font-medium">Previsto</th>
                      <th className="pb-2 text-right font-medium">Real</th>
                      <th className="pb-2 text-right font-medium">Desvio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.budgetLines.map((line) => (
                      <tr
                        key={line.category}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 text-foreground">{line.category}</td>
                        <td className="py-2 text-right text-foreground">
                          {formatCurrency(line.planned)}
                        </td>
                        <td className="py-2 text-right text-foreground">
                          {formatCurrency(line.actual)}
                        </td>
                        <td
                          className={`py-2 text-right font-medium ${
                            line.variance >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {line.variance >= 0 ? "+" : ""}
                          {formatCurrency(line.variance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-border font-semibold">
                      <td className="py-2 text-foreground">Total</td>
                      <td className="py-2 text-right text-foreground">
                        {formatCurrency(r.budgetTotal)}
                      </td>
                      <td className="py-2 text-right text-foreground">
                        {formatCurrency(r.totalExpenses)}
                      </td>
                      <td
                        className={`py-2 text-right ${
                          r.budgetTotal - r.totalExpenses >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {r.budgetTotal - r.totalExpenses >= 0 ? "+" : ""}
                        {formatCurrency(r.budgetTotal - r.totalExpenses)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reserve fund */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-card-foreground">
              Fundo de reserva
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="Percentagem" value={`${r.reserveFundPercentage}%`} />
              <Stat
                label="Contribuições"
                value={formatCurrency(r.reserveFundContributions)}
              />
              <Stat
                label="Saldo estimado"
                value={formatCurrency(r.reserveFundBalance)}
                color="text-primary"
              />
            </div>
          </div>

          {/* Unit debts */}
          {r.unitDebts.length > 0 && (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <h2 className="mb-4 px-6 pt-6 flex items-center gap-2 text-lg font-semibold text-card-foreground">
                <AlertTriangle size={18} className="text-red-500" />
                Dívidas por fração
              </h2>
              <div className="overflow-x-auto px-6 pb-6">
                <table className="w-full text-sm min-w-[450px]">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Fração</th>
                      <th className="pb-2 font-medium">Proprietário</th>
                      <th className="pb-2 text-right font-medium">
                        <Clock size={12} className="mr-1 inline" />
                        Pendente
                      </th>
                      <th className="pb-2 text-right font-medium">
                        <AlertTriangle size={12} className="mr-1 inline" />
                        Em atraso
                      </th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.unitDebts.map((unit) => (
                      <tr
                        key={unit.unitIdentifier}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 font-medium text-foreground">
                          {unit.unitIdentifier}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {unit.ownerName || "—"}
                        </td>
                        <td className="py-2 text-right text-amber-600">
                          {formatCurrency(unit.pendingAmount)}
                        </td>
                        <td className="py-2 text-right text-red-600">
                          {formatCurrency(unit.overdueAmount)}
                        </td>
                        <td className="py-2 text-right font-semibold text-foreground">
                          {formatCurrency(unit.totalDebt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`mt-1 text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-foreground",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}
