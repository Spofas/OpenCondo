"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  quotaGenerateSchema,
  type QuotaGenerateInput,
} from "@/lib/validators/quota";
import { generateQuotas } from "./actions";
import type { UnitData } from "./quota-page-client";

interface QuotaGenerateFormProps {
  units: UnitData[];
  defaultSplitMethod: "PERMILAGEM" | "EQUAL";
  onClose: () => void;
}

export function QuotaGenerateForm({
  units,
  defaultSplitMethod,
  onClose,
}: QuotaGenerateFormProps) {
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuotaGenerateInput>({
    resolver: zodResolver(quotaGenerateSchema),
    defaultValues: {
      startMonth: `${currentYear}-${String(currentMonth).padStart(2, "0")}`,
      endMonth: `${currentYear}-12`,
      totalMonthlyAmount: 0,
      splitMethod: defaultSplitMethod,
      dueDay: 8,
    },
  });

  const watchAmount = watch("totalMonthlyAmount");
  const watchSplit = watch("splitMethod");

  // Preview per-unit amounts
  const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);
  const previewAmounts = units.map((unit) => {
    if (!watchAmount || watchAmount <= 0) return { ...unit, amount: 0 };
    if (watchSplit === "PERMILAGEM" && totalPermilagem > 0) {
      return {
        ...unit,
        amount:
          Math.round((watchAmount * unit.permilagem * 100) / totalPermilagem) /
          100,
      };
    }
    return {
      ...unit,
      amount: Math.round((watchAmount * 100) / units.length) / 100,
    };
  });

  async function onSubmit(data: QuotaGenerateInput) {
    setIsSubmitting(true);
    setError("");
    setSuccessMsg("");

    const result = await generateQuotas(data);

    if (!result.success) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    if ("message" in result) {
      setSuccessMsg(result.message as string);
    }

    // Close after a short delay so user can see success message
    setTimeout(() => onClose(), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:bg-black/50 md:flex md:items-start md:justify-center md:p-4 md:pt-16">
      <div className="w-full md:max-w-2xl md:rounded-xl md:border md:border-border bg-card md:shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            Gerar quotas
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
          {successMsg && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          {/* Period range */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Mês inicial
              </label>
              <input
                type="month"
                {...register("startMonth")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.startMonth && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.startMonth.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Mês final
              </label>
              <input
                type="month"
                {...register("endMonth")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.endMonth && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.endMonth.message}
                </p>
              )}
            </div>
          </div>

          {/* Amount, split method, due day */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Valor mensal total (€)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  {...register("totalMonthlyAmount", { valueAsNumber: true })}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {errors.totalMonthlyAmount && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.totalMonthlyAmount.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Divisão
              </label>
              <select
                {...register("splitMethod")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="PERMILAGEM">Por permilagem</option>
                <option value="EQUAL">Divisão igual</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Dia de vencimento
              </label>
              <input
                type="number"
                min={1}
                max={28}
                {...register("dueDay", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.dueDay && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.dueDay.message}
                </p>
              )}
            </div>
          </div>

          {/* Preview: per-unit amounts */}
          {units.length > 0 && watchAmount > 0 && (
            <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
              <h3 className="mb-3 text-sm font-medium text-foreground">
                Pré-visualização por fração
              </h3>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Fração</th>
                      {watchSplit === "PERMILAGEM" && (
                        <th className="pb-2 font-medium">Permilagem</th>
                      )}
                      <th className="pb-2 text-right font-medium">
                        Valor mensal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewAmounts.map((unit) => (
                      <tr
                        key={unit.id}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 font-medium text-foreground">
                          {unit.identifier}
                        </td>
                        {watchSplit === "PERMILAGEM" && (
                          <td className="py-2 text-muted-foreground">
                            {unit.permilagem}‰
                          </td>
                        )}
                        <td className="py-2 text-right text-foreground">
                          €
                          {unit.amount.toLocaleString("pt-PT", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-2 border-t border-border pt-2">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total mensal</span>
                  <span>
                    €
                    {previewAmounts
                      .reduce((sum, u) => sum + u.amount, 0)
                      .toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No units warning */}
          {units.length === 0 && (
            <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Não existem frações registadas. Adicione frações nas definições
              antes de gerar quotas.
            </div>
          )}

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
              disabled={isSubmitting || units.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "A gerar..." : "Gerar quotas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
