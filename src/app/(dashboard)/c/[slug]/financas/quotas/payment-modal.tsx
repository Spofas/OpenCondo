"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  quotaPaymentSchema,
  type QuotaPaymentInput,
  PAYMENT_METHODS,
} from "@/lib/validators/quota";
import { recordPayment } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import type { QuotaData } from "./quota-page-client";

interface PaymentModalProps {
  quota: QuotaData;
  onClose: () => void;
}

export function PaymentModal({ quota, onClose }: PaymentModalProps) {
  const { condominiumId } = useCondominium();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotaPaymentInput>({
    resolver: zodResolver(quotaPaymentSchema),
    defaultValues: {
      paymentDate: today,
      paymentMethod: "TRANSFERENCIA",
      paymentNotes: "",
    },
  });

  async function onSubmit(data: QuotaPaymentInput) {
    setIsSubmitting(true);
    setError("");

    const result = await recordPayment(condominiumId, quota.id, data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Registar pagamento
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

          {/* Quota info */}
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fração</span>
              <span className="font-medium text-foreground">
                {quota.unitIdentifier}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Período</span>
              <span className="font-medium text-foreground">
                {quota.period}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-semibold text-foreground">
                €
                {quota.amount.toLocaleString("pt-PT", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Payment date */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Data de pagamento
            </label>
            <input
              type="date"
              {...register("paymentDate")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.paymentDate && (
              <p className="mt-1 text-xs text-destructive">
                {errors.paymentDate.message}
              </p>
            )}
          </div>

          {/* Payment method */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Método de pagamento
            </label>
            <select
              {...register("paymentMethod")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-xs text-destructive">
                {errors.paymentMethod.message}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Ref. MB 123456789"
              {...register("paymentNotes")}
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
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? "A registar..." : "Confirmar pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
