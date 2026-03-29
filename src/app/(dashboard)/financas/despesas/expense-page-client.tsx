"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { ExpenseList } from "./expense-list";
import { ExpenseForm } from "./expense-form";
import { RecurringExpenseList } from "../despesas-recorrentes/recurring-expense-list";
import { RecurringExpenseForm } from "../despesas-recorrentes/recurring-expense-form";
import { generateRecurringExpenses } from "../despesas-recorrentes/actions";
import type { RecurringExpenseData } from "../despesas-recorrentes/recurring-expense-page-client";

export interface ExpenseData {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string | null;
}

type Tab = "despesas" | "recorrentes";

export function ExpensePageClient({
  expenses,
  isAdmin,
  recurringTemplates,
}: {
  expenses: ExpenseData[];
  isAdmin: boolean;
  recurringTemplates: RecurringExpenseData[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("despesas");
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringExpenseData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [genError, setGenError] = useState("");

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  async function handleGenerate() {
    setGenerating(true);
    setMessage("");
    setGenError("");
    const result = await generateRecurringExpenses(currentPeriod);
    if (result.error) setGenError(result.error);
    else if (result.message) setMessage(result.message);
    setGenerating(false);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Registo e acompanhamento de despesas
          </p>
        </div>

        {isAdmin && activeTab === "despesas" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Registar despesa
          </button>
        )}

        {isAdmin && activeTab === "recorrentes" && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={generating || recurringTemplates.filter((t) => t.isActive).length === 0}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
              {generating ? "A gerar..." : `Gerar ${currentPeriod}`}
            </button>
            <button
              onClick={() => setShowRecurringForm(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus size={16} />
              Novo modelo
            </button>
          </div>
        )}
      </div>

      {/* Tabs — only shown to admin since recurring is admin-only */}
      {isAdmin && (
        <div className="mb-6 flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("despesas")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "despesas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Despesas
          </button>
          <button
            onClick={() => setActiveTab("recorrentes")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "recorrentes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Custos recorrentes
          </button>
        </div>
      )}

      {activeTab === "despesas" && (
        <ExpenseList
          expenses={expenses}
          isAdmin={isAdmin}
          onEdit={(expense) => setEditingExpense(expense)}
        />
      )}

      {activeTab === "recorrentes" && (
        <>
          {message && (
            <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
          {genError && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {genError}
            </div>
          )}
          <RecurringExpenseList
            templates={recurringTemplates}
            onEdit={(t) => setEditingTemplate(t)}
          />
        </>
      )}

      {showForm && <ExpenseForm onClose={() => setShowForm(false)} />}
      {editingExpense && (
        <ExpenseForm
          existingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
      {showRecurringForm && (
        <RecurringExpenseForm onClose={() => setShowRecurringForm(false)} />
      )}
      {editingTemplate && (
        <RecurringExpenseForm
          existingTemplate={editingTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
