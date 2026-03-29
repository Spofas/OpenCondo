"use client";

import { useState } from "react";
import { RefreshCw, Edit2, Trash2, Pause, Play } from "lucide-react";
import { FREQUENCY_LABELS } from "@/lib/validators/recurring-expense";
import { toggleRecurringExpense, deleteRecurringExpense } from "./actions";
import type { RecurringExpenseData } from "./recurring-expense-page-client";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

export function RecurringExpenseList({
  templates,
  onEdit,
}: {
  templates: RecurringExpenseData[];
  onEdit: (t: RecurringExpenseData) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function handleToggle(id: string) {
    setActionError("");
    const result = await toggleRecurringExpense(id);
    if (result.error) setActionError(result.error);
  }

  async function handleDelete(id: string) {
    setActionError("");
    const result = await deleteRecurringExpense(id);
    if (result.error) setActionError(result.error);
    setConfirmDelete(null);
  }

  const activeTotal = templates
    .filter((t) => t.isActive)
    .reduce((s, t) => s + t.amount, 0);

  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <RefreshCw size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum modelo de despesa recorrente</p>
          <p className="text-xs">
            Crie modelos para gerar despesas automaticamente todos os meses
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Monthly total */}
      <div className="mb-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Total mensal (modelos ativos)
          </span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(activeTotal)}
          </span>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {templates.map((t) => (
          <div key={t.id} className={`rounded-xl border border-border bg-card p-4 ${!t.isActive ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{t.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t.category}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {FREQUENCY_LABELS[t.frequency] || t.frequency}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground whitespace-nowrap">
                  {formatCurrency(t.amount)}
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  {t.isActive ? "Ativo" : "Pausado"}
                </span>
              </div>
            </div>
            {t.lastGenerated && (
              <p className="mt-2 text-xs text-muted-foreground">Último: {t.lastGenerated}</p>
            )}
            <div className="mt-2 flex justify-end gap-1">
              <button
                onClick={() => handleToggle(t.id)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title={t.isActive ? "Pausar" : "Ativar"}
              >
                {t.isActive ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={() => onEdit(t)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Editar"
              >
                <Edit2 size={14} />
              </button>
              {confirmDelete === t.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                  >
                    Sim
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(t.id)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Descrição</th>
              <th className="px-6 py-3 font-medium">Categoria</th>
              <th className="px-6 py-3 font-medium">Frequência</th>
              <th className="px-6 py-3 text-right font-medium">Valor</th>
              <th className="px-6 py-3 font-medium">Estado</th>
              <th className="px-6 py-3 font-medium">Último</th>
              <th className="px-6 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr
                key={t.id}
                className={`border-b border-border/50 ${!t.isActive ? "opacity-50" : ""}`}
              >
                <td className="px-6 py-3 font-medium text-foreground">
                  {t.description}
                </td>
                <td className="px-6 py-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {t.category}
                  </span>
                </td>
                <td className="px-6 py-3 text-muted-foreground">
                  {FREQUENCY_LABELS[t.frequency] || t.frequency}
                </td>
                <td className="px-6 py-3 text-right font-medium text-foreground">
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      t.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.isActive ? "Ativo" : "Pausado"}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-muted-foreground">
                  {t.lastGenerated || "—"}
                </td>
                <td className="px-6 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggle(t.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title={t.isActive ? "Pausar" : "Ativar"}
                    >
                      {t.isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={() => onEdit(t)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      title="Editar"
                    >
                      <Edit2 size={14} />
                    </button>
                    {confirmDelete === t.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="rounded-lg bg-destructive px-2 py-1 text-xs font-medium text-white hover:bg-destructive/90"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="rounded-lg border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(t.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
