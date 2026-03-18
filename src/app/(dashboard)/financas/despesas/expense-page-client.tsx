"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ExpenseList } from "./expense-list";
import { ExpenseForm } from "./expense-form";

export interface ExpenseData {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  notes: string | null;
}

export function ExpensePageClient({
  expenses,
  isAdmin,
}: {
  expenses: ExpenseData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Despesas</h1>
          <p className="text-sm text-muted-foreground">
            Registo e acompanhamento de despesas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Registar despesa
          </button>
        )}
      </div>

      <ExpenseList
        expenses={expenses}
        isAdmin={isAdmin}
        onEdit={(expense) => setEditingExpense(expense)}
      />

      {showForm && <ExpenseForm onClose={() => setShowForm(false)} />}
      {editingExpense && (
        <ExpenseForm
          existingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </div>
  );
}
