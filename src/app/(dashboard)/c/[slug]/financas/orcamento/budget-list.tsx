"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Edit2,
  Trash2,
  PieChart,
} from "lucide-react";
import { approveBudget, deleteBudget } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import { BudgetForm } from "./budget-form";

interface BudgetItemData {
  id: string;
  category: string;
  description: string | null;
  plannedAmount: number;
}

interface BudgetData {
  id: string;
  year: number;
  status: "DRAFT" | "APPROVED";
  totalAmount: number;
  reserveFundPercentage: number;
  approvedAt: string | null;
  createdAt: string;
  items: BudgetItemData[];
}

export function BudgetList({
  budgets,
  isAdmin,
}: {
  budgets: BudgetData[];
  isAdmin: boolean;
}) {
  const { condominiumId } = useCondominium();
  const [expandedId, setExpandedId] = useState<string | null>(
    budgets[0]?.id ?? null
  );
  const [editingBudget, setEditingBudget] = useState<BudgetData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function handleApprove(budgetId: string) {
    setActionError("");
    const result = await approveBudget(condominiumId, budgetId);
    if (result.error) setActionError(result.error);
  }

  async function handleDelete(budgetId: string) {
    setActionError("");
    const result = await deleteBudget(condominiumId, budgetId);
    if (result.error) {
      setActionError(result.error);
    }
    setConfirmDelete(null);
  }

  if (budgets.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <PieChart size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum orçamento criado</p>
          <p className="text-xs">
            Crie o orçamento anual para calcular as quotas
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

      <div className="space-y-4">
        {budgets.map((budget) => {
          const isExpanded = expandedId === budget.id;
          const reserveAmount =
            budget.totalAmount * (budget.reserveFundPercentage / 100);
          const grandTotal = budget.totalAmount + reserveAmount;

          return (
            <div
              key={budget.id}
              className="rounded-xl border border-border bg-card"
            >
              {/* Header */}
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : budget.id)
                }
                className="flex w-full items-center justify-between px-6 py-4 text-left"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Orçamento {budget.year}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      €
                      {grandTotal.toLocaleString("pt-PT", {
                        minimumFractionDigits: 2,
                      })}
                      {" · "}
                      {budget.items.length} rubrica
                      {budget.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      budget.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {budget.status === "APPROVED" ? "Aprovado" : "Rascunho"}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={20} className="text-muted-foreground" />
                )}
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="border-t border-border px-6 py-4">
                  {/* Mobile cards */}
                  <div className="space-y-2 md:hidden">
                    {budget.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-background p-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground">{item.category}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          )}
                        </div>
                        <p className="ml-3 font-medium text-foreground whitespace-nowrap">
                          €{item.plannedAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Items table (desktop) */}
                  <table className="hidden md:table w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Categoria</th>
                        <th className="pb-2 font-medium">Descrição</th>
                        <th className="pb-2 text-right font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {budget.items.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-border/50"
                        >
                          <td className="py-2.5 font-medium text-foreground">
                            {item.category}
                          </td>
                          <td className="py-2.5 text-muted-foreground">
                            {item.description || "—"}
                          </td>
                          <td className="py-2.5 text-right text-foreground">
                            €
                            {item.plannedAmount.toLocaleString("pt-PT", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="mt-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Subtotal rubricas
                      </span>
                      <span className="font-medium">
                        €
                        {budget.totalAmount.toLocaleString("pt-PT", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Fundo de reserva ({budget.reserveFundPercentage}%)
                      </span>
                      <span className="font-medium">
                        €
                        {reserveAmount.toLocaleString("pt-PT", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-border pt-2 font-semibold">
                      <span>Total</span>
                      <span>
                        €
                        {grandTotal.toLocaleString("pt-PT", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Actions (admin only, draft only) */}
                  {isAdmin && budget.status === "DRAFT" && (
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      <button
                        onClick={() => handleApprove(budget.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                      >
                        <CheckCircle size={14} />
                        Aprovar
                      </button>
                      <button
                        onClick={() => setEditingBudget(budget)}
                        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                      >
                        <Edit2 size={14} />
                        Editar
                      </button>
                      {confirmDelete === budget.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Tem a certeza?
                          </span>
                          <button
                            onClick={() => handleDelete(budget.id)}
                            className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/90"
                          >
                            Sim, eliminar
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(budget.id)}
                          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 size={14} />
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}

                  {budget.status === "APPROVED" && budget.approvedAt && (
                    <p className="mt-4 border-t border-border pt-3 text-xs text-muted-foreground">
                      Aprovado em{" "}
                      {new Date(budget.approvedAt).toLocaleDateString("pt-PT")}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingBudget && (
        <BudgetForm
          existingBudget={editingBudget}
          onClose={() => setEditingBudget(null)}
        />
      )}
    </>
  );
}
