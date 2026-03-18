"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, X } from "lucide-react";
import {
  budgetSchema,
  type BudgetInput,
  BUDGET_CATEGORIES,
} from "@/lib/validators/budget";
import { createBudget, updateBudget } from "./actions";

interface BudgetFormProps {
  onClose: () => void;
  existingBudget?: {
    id: string;
    year: number;
    reserveFundPercentage: number;
    items: { id: string; category: string; description: string | null; plannedAmount: number }[];
  };
}

export function BudgetForm({ onClose, existingBudget }: BudgetFormProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingBudget;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: existingBudget
      ? {
          year: existingBudget.year,
          reserveFundPercentage: existingBudget.reserveFundPercentage,
          items: existingBudget.items.map((item) => ({
            id: item.id,
            category: item.category,
            description: item.description || "",
            plannedAmount: item.plannedAmount,
          })),
        }
      : {
          year: new Date().getFullYear(),
          reserveFundPercentage: 10,
          items: [{ category: "", description: "", plannedAmount: 0 }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");
  const totalAmount = watchItems?.reduce(
    (sum, item) => sum + (Number(item?.plannedAmount) || 0),
    0
  );

  const reserveFund = watch("reserveFundPercentage");
  const reserveAmount = totalAmount * ((Number(reserveFund) || 0) / 100);

  async function onSubmit(data: BudgetInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateBudget(existingBudget.id, data)
      : await createBudget(data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar orçamento" : "Novo orçamento"}
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

          {/* Year & Reserve Fund */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Ano
              </label>
              <input
                type="number"
                {...register("year", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.year && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.year.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Fundo de reserva (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("reserveFundPercentage", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.reserveFundPercentage && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.reserveFundPercentage.message}
                </p>
              )}
            </div>
          </div>

          {/* Budget Items */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                Rubricas
              </label>
              <button
                type="button"
                onClick={() =>
                  append({ category: "", description: "", plannedAmount: 0 })
                }
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Plus size={14} />
                Adicionar rubrica
              </button>
            </div>

            {errors.items?.root && (
              <p className="mb-2 text-xs text-destructive">
                {errors.items.root.message}
              </p>
            )}

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="rounded-lg border border-border bg-muted/50 p-3"
                >
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                    <div>
                      <select
                        {...register(`items.${index}.category`)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="">Selecionar categoria</option>
                        {BUDGET_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.category && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.items[index].category.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          €
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...register(`items.${index}.plannedAmount`, {
                            valueAsNumber: true,
                          })}
                          className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {errors.items?.[index]?.plannedAmount && (
                        <p className="mt-1 text-xs text-destructive">
                          {errors.items[index].plannedAmount.message}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fields.length > 1 && remove(index)}
                      disabled={fields.length <= 1}
                      className="flex h-[38px] w-[38px] items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Descrição (opcional)"
                    {...register(`items.${index}.description`)}
                    className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total rubricas</span>
              <span className="font-medium text-foreground">
                €{totalAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-sm">
              <span className="text-muted-foreground">
                Fundo de reserva ({Number(reserveFund) || 0}%)
              </span>
              <span className="font-medium text-foreground">
                €{reserveAmount.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 border-t border-border pt-2">
              <div className="flex justify-between text-sm font-semibold">
                <span>Total orçamento</span>
                <span>
                  €{(totalAmount + reserveAmount).toLocaleString("pt-PT", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
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
                  : "Criar orçamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
