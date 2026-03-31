"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { RecurringExpenseList } from "./recurring-expense-list";
import { RecurringExpenseForm } from "./recurring-expense-form";
import { generateRecurringExpenses } from "./actions";
import { useCondominium } from "@/lib/condominium-context";

export interface RecurringExpenseData {
  id: string;
  description: string;
  amount: number;
  category: string;
  frequency: string;
  isActive: boolean;
  lastGenerated: string | null;
}

export function RecurringExpensePageClient({
  templates,
}: {
  templates: RecurringExpenseData[];
}) {
  const { condominiumId } = useCondominium();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RecurringExpenseData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  async function handleGenerate() {
    setGenerating(true);
    setMessage("");
    setError("");
    const result = await generateRecurringExpenses(condominiumId, currentPeriod);
    if (!result.success) {
      setError(result.error);
    } else if ("message" in result) {
      setMessage(result.message as string);
    }
    setGenerating(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Despesas recorrentes
          </h1>
          <p className="text-sm text-muted-foreground">
            Modelos de despesas que se repetem periodicamente
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerate}
            disabled={generating || templates.filter((t) => t.isActive).length === 0}
            className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw size={16} className={generating ? "animate-spin" : ""} />
            {generating ? "A gerar..." : `Gerar ${currentPeriod}`}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo modelo
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-green-100 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <RecurringExpenseList
        templates={templates}
        onEdit={(t) => setEditing(t)}
      />

      {showForm && <RecurringExpenseForm onClose={() => setShowForm(false)} />}
      {editing && (
        <RecurringExpenseForm
          existingTemplate={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
