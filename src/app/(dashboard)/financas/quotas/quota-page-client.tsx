"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { QuotaList } from "./quota-list";
import { QuotaGenerateForm } from "./quota-generate-form";
import { DebtorClient } from "../devedores/debtor-client";
import type { DebtorSummary } from "@/lib/debtor-calculations";

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

type Tab = "quotas" | "devedores";

export function QuotaPageClient({
  quotas,
  units,
  defaultSplitMethod,
  isAdmin,
  debtorSummary,
}: {
  quotas: QuotaData[];
  units: UnitData[];
  defaultSplitMethod: "PERMILAGEM" | "EQUAL";
  isAdmin: boolean;
  debtorSummary: DebtorSummary | null;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("quotas");
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
        {isAdmin && activeTab === "quotas" && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Gerar quotas
          </button>
        )}
      </div>

      {/* Tabs — only shown to admin since debtors is admin-only */}
      {isAdmin && (
        <div className="mb-6 flex gap-1 border-b border-border">
          <button
            onClick={() => setActiveTab("quotas")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "quotas"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Quotas
          </button>
          <button
            onClick={() => setActiveTab("devedores")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === "devedores"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Devedores
          </button>
        </div>
      )}

      {activeTab === "quotas" && (
        <QuotaList quotas={quotas} isAdmin={isAdmin} />
      )}

      {activeTab === "devedores" && debtorSummary && (
        <DebtorClient summary={debtorSummary} hideTitle />
      )}

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
