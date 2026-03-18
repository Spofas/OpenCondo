"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuotaList } from "./quota-list";
import { QuotaGenerateForm } from "./quota-generate-form";

export interface QuotaData {
  id: string;
  unitId: string;
  unitIdentifier: string;
  unitPermilagem: number;
  period: string;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paymentDate: string | null;
  paymentMethod: string | null;
  paymentNotes: string | null;
}

export interface UnitData {
  id: string;
  identifier: string;
  permilagem: number;
}

export function QuotaPageClient({
  quotas,
  units,
  defaultSplitMethod,
  isAdmin,
}: {
  quotas: QuotaData[];
  units: UnitData[];
  defaultSplitMethod: "PERMILAGEM" | "EQUAL";
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quotas</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de quotas de condomínio
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Gerar quotas
          </button>
        )}
      </div>

      <QuotaList quotas={quotas} isAdmin={isAdmin} />

      {showForm && (
        <QuotaGenerateForm
          units={units}
          defaultSplitMethod={defaultSplitMethod}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}
