"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { ContractList } from "./contract-list";
const ContractForm = dynamic(() => import("./contract-form").then(m => m.ContractForm));

export interface ContractData {
  id: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string | null;
  renewalType: string;
  annualCost: number;
  paymentFrequency: string;
  status: string;
  policyNumber: string | null;
  insuredValue: number | null;
  coverageType: string | null;
  notes: string | null;
  documentUrl: string | null;
  supplierName: string | null;
}

export function ContractPageClient({
  contracts,
  isAdmin,
}: {
  contracts: ContractData[];
  isAdmin: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractData | null>(null);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de contratos e seguros
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            Novo contrato
          </button>
        )}
      </div>

      <ContractList
        contracts={contracts}
        isAdmin={isAdmin}
        onEdit={(c) => setEditingContract(c)}
      />

      {showForm && <ContractForm onClose={() => setShowForm(false)} />}
      {editingContract && (
        <ContractForm
          existingContract={editingContract}
          onClose={() => setEditingContract(null)}
        />
      )}
    </div>
  );
}
