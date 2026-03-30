"use client";

import { useState, useOptimistic, useTransition } from "react";
import { FileSignature, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { deleteContract, updateContractStatus } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import {
  STATUS_LABELS,
  FREQUENCY_LABELS,
  CONTRACT_STATUSES,
} from "@/lib/validators/contract";
import type { ContractData } from "./contract-page-client";

function formatCurrency(amount: number): string {
  return `€${amount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`;
}

const STATUS_COLORS: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700",
  EXPIRADO: "bg-red-100 text-red-700",
  RENOVADO: "bg-blue-100 text-blue-700",
  CANCELADO: "bg-gray-100 text-gray-700",
};

export function ContractList({
  contracts,
  isAdmin,
  onEdit,
}: {
  contracts: ContractData[];
  isAdmin: boolean;
  onEdit: (contract: ContractData) => void;
}) {
  const { condominiumId } = useCondominium();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [, startTransition] = useTransition();

  type OptimisticAction = { type: "delete"; id: string };

  const [optimisticContracts, addOptimistic] = useOptimistic(
    contracts,
    (state, action: OptimisticAction) => {
      if (action.type === "delete") return state.filter((item) => item.id !== action.id);
      return state;
    }
  );

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    startTransition(async () => {
      addOptimistic({ type: "delete", id });
      const result = await deleteContract(condominiumId, id);
      if (result.error) setActionError(result.error);
    });
  }

  async function handleStatusChange(id: string, status: string) {
    setActionError("");
    const result = await updateContractStatus(condominiumId, id, status);
    if (result.error) setActionError(result.error);
  }

  if (optimisticContracts.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
          <FileSignature size={40} strokeWidth={1.5} />
          <p className="text-sm">Nenhum contrato registado</p>
          <p className="text-xs">
            Registe contratos de manutenção, seguros e outros serviços
          </p>
        </div>
      </div>
    );
  }

  // Summary
  const activeContracts = optimisticContracts.filter((c) => c.status === "ATIVO");
  const totalAnnualCost = activeContracts.reduce(
    (sum, c) => sum + c.annualCost,
    0
  );

  // Contracts expiring within 30 days
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringContracts = activeContracts.filter(
    (c) => c.endDate && new Date(c.endDate) <= thirtyDays
  );

  return (
    <>
      {actionError && (
        <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {activeContracts.length}
          </div>
          <div className="text-xs text-muted-foreground">Contratos ativos</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalAnnualCost)}
          </div>
          <div className="text-xs text-muted-foreground">Custo anual total</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div
            className={`text-2xl font-bold ${
              expiringContracts.length > 0
                ? "text-orange-600"
                : "text-foreground"
            }`}
          >
            {expiringContracts.length}
          </div>
          <div className="text-xs text-muted-foreground">A expirar (30 dias)</div>
        </div>
      </div>

      {/* Expiring warning */}
      {expiringContracts.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertTriangle size={16} />
          {expiringContracts.length} contrato
          {expiringContracts.length !== 1 ? "s" : ""} a expirar nos próximos 30
          dias
        </div>
      )}

      {/* Contract list */}
      <div className="space-y-4">
        {optimisticContracts.map((contract) => (
          <div
            key={contract.id}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-foreground">
                    {contract.description}
                  </h3>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                    {contract.type}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[contract.status] || "bg-muted text-foreground"
                    }`}
                  >
                    {STATUS_LABELS[contract.status]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {new Date(contract.startDate).toLocaleDateString("pt-PT")}
                    {contract.endDate &&
                      ` — ${new Date(contract.endDate).toLocaleDateString("pt-PT")}`}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(contract.annualCost)}/ano
                  </span>
                  <span>{FREQUENCY_LABELS[contract.paymentFrequency]}</span>
                  {contract.supplierName && (
                    <span>Fornecedor: {contract.supplierName}</span>
                  )}
                </div>

                {/* Insurance details */}
                {contract.type === "Seguro" && contract.policyNumber && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Apólice: {contract.policyNumber}
                    {contract.insuredValue &&
                      ` | Valor segurado: ${formatCurrency(contract.insuredValue)}`}
                    {contract.coverageType &&
                      ` | ${contract.coverageType}`}
                  </div>
                )}

                {contract.notes && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {contract.notes}
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={contract.status}
                    onChange={(e) =>
                      handleStatusChange(contract.id, e.target.value)
                    }
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                  >
                    {CONTRACT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => onEdit(contract)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  {confirmDelete === contract.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(contract.id)}
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
                      onClick={() => setConfirmDelete(contract.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
