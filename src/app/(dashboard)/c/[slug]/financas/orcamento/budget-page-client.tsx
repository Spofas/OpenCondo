"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { BudgetList } from "./budget-list";
const BudgetForm = dynamic(() => import("./budget-form").then(m => m.BudgetForm));

interface BudgetItemData {
  id: string;
  category: string;
  description: string | null;
  plannedAmount: number;
  actualAmount: number;
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

export function BudgetPageClient({
  budgets,
  isAdmin,
}: {
  budgets: BudgetData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamento</h1>
          <p className="text-sm text-muted-foreground">
            Orçamento anual e fundo de reserva
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Novo orçamento
          </button>
        )}
      </div>

      <BudgetList budgets={budgets} isAdmin={isAdmin} />

      {showForm && <BudgetForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
