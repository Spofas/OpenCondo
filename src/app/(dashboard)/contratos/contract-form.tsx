"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  contractSchema,
  type ContractInput,
  CONTRACT_TYPES,
  RENEWAL_TYPES,
  PAYMENT_FREQUENCIES,
  RENEWAL_LABELS,
  FREQUENCY_LABELS,
} from "@/lib/validators/contract";
import { createContract, updateContract } from "./actions";
import type { ContractData } from "./contract-page-client";

interface ContractFormProps {
  onClose: () => void;
  existingContract?: ContractData;
}

export function ContractForm({ onClose, existingContract }: ContractFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingContract;
  const [isInsurance, setIsInsurance] = useState(
    existingContract?.type === "Seguro"
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ContractInput>({
    resolver: zodResolver(contractSchema),
    defaultValues: existingContract
      ? {
          description: existingContract.description,
          type: existingContract.type,
          startDate: existingContract.startDate.split("T")[0],
          endDate: existingContract.endDate?.split("T")[0] || "",
          renewalType: existingContract.renewalType,
          annualCost: existingContract.annualCost,
          paymentFrequency: existingContract.paymentFrequency,
          notes: existingContract.notes || "",
          policyNumber: existingContract.policyNumber || "",
          insuredValue: existingContract.insuredValue || undefined,
          coverageType: existingContract.coverageType || "",
          supplierName: existingContract.supplierName || "",
        }
      : {
          description: "",
          type: "",
          startDate: "",
          endDate: "",
          renewalType: "MANUAL",
          annualCost: 0,
          paymentFrequency: "ANUAL",
          notes: "",
          policyNumber: "",
          coverageType: "",
          supplierName: "",
          supplierNif: "",
          supplierPhone: "",
          supplierEmail: "",
        },
  });

  const watchType = watch("type");
  if (watchType === "Seguro" && !isInsurance) setIsInsurance(true);
  if (watchType !== "Seguro" && isInsurance) setIsInsurance(false);

  async function onSubmit(data: ContractInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateContract(existingContract.id, data)
      : await createContract(data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar contrato" : "Novo contrato"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Type & Description */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Tipo
              </label>
              <select
                {...register("type")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar</option>
                {CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="mt-1 text-xs text-destructive">{errors.type.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Custo anual
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register("annualCost", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {errors.annualCost && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.annualCost.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Contrato de manutenção do elevador"
              {...register("description")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Data de início
              </label>
              <input
                type="date"
                {...register("startDate")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Data de fim (opcional)
              </label>
              <input
                type="date"
                {...register("endDate")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Renewal & Payment */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Renovação
              </label>
              <select
                {...register("renewalType")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {RENEWAL_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {RENEWAL_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Frequência de pagamento
              </label>
              <select
                {...register("paymentFrequency")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {PAYMENT_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {FREQUENCY_LABELS[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Insurance-specific fields */}
          {isInsurance && (
            <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Dados do seguro
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    N.º da apólice
                  </label>
                  <input
                    type="text"
                    {...register("policyNumber")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Valor segurado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      €
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      {...register("insuredValue", { valueAsNumber: true })}
                      className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-foreground">
                  Tipo de cobertura
                </label>
                <input
                  type="text"
                  placeholder="Ex: Multirriscos"
                  {...register("coverageType")}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Supplier info */}
          {!isEditing && (
            <div className="mb-4 rounded-lg border border-border/50 bg-muted/30 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Fornecedor (opcional)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Nome
                  </label>
                  <input
                    type="text"
                    {...register("supplierName")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    NIF
                  </label>
                  <input
                    type="text"
                    {...register("supplierNif")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Telefone
                  </label>
                  <input
                    type="text"
                    {...register("supplierPhone")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-foreground">
                    Email
                  </label>
                  <input
                    type="email"
                    {...register("supplierEmail")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notas (opcional)
            </label>
            <input
              type="text"
              {...register("notes")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting
                ? "A guardar..."
                : isEditing
                  ? "Guardar alterações"
                  : "Criar contrato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
