"use client";

import { useState } from "react";
import { Receipt, Edit2, Trash2 } from "lucide-react";
import { deleteExpense } from "./actions";
import type { ExpenseData } from "./expense-page-client";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

export function ExpenseList({
  expenses,
  isAdmin,
  onEdit,
}: {
  expenses: ExpenseData[];
  isAdmin: boolean;
  onEdit: (expense: ExpenseData) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function handleDelete(expenseId: string) {
    setActionError("");
    const result = await deleteExpense(expenseId);
    if (result.error) {
      setActionError(result.error);
    }
    setConfirmDelete(null);
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <Receipt size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhuma despesa registada</p>
          <p className="text-xs">
            Registe as despesas do condomínio para acompanhar os gastos
          </p>
        </div>
      </div>
    );
  }

  // Summary by category
  const categoryTotals = new Map<string, number>();
  let grandTotal = 0;
  for (const expense of expenses) {
    const current = categoryTotals.get(expense.category) || 0;
    categoryTotals.set(expense.category, current + expense.amount);
    grandTotal += expense.amount;
  }

  const sortedCategories = Array.from(categoryTotals.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Summary by category */}
      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-card-foreground">
          Resumo por categoria
        </h3>
        <div className="space-y-2">
          {sortedCategories.map(([category, total]) => {
            const percentage = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
            return (
              <div key={category}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{category}</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(total)}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                  <div
                    className="h-1.5 rounded-full bg-primary/60"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex justify-between text-sm font-semibold">
            <span>Total</span>
            <span>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Expense list */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Descrição</th>
              <th className="px-6 py-3 font-medium">Categoria</th>
              <th className="px-6 py-3 text-right font-medium">Valor</th>
              {isAdmin && (
                <th className="px-6 py-3 text-right font-medium">Ações</th>
              )}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-border/50">
                <td className="px-6 py-3 text-muted-foreground">
                  {new Date(expense.date).toLocaleDateString("pt-PT")}
                </td>
                <td className="px-6 py-3">
                  <div className="font-medium text-foreground">
                    {expense.description}
                  </div>
                  {expense.notes && (
                    <div className="text-xs text-muted-foreground">
                      {expense.notes}
                    </div>
                  )}
                </td>
                <td className="px-6 py-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {expense.category}
                  </span>
                </td>
                <td className="px-6 py-3 text-right font-medium text-foreground">
                  {formatCurrency(expense.amount)}
                </td>
                {isAdmin && (
                  <td className="px-6 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(expense)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      {confirmDelete === expense.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(expense.id)}
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
                          onClick={() => setConfirmDelete(expense.id)}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
