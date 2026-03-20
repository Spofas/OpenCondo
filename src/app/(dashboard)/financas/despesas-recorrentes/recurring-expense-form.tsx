"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  recurringExpenseSchema,
  type RecurringExpenseInput,
  FREQUENCY_LABELS,
} from "@/lib/validators/recurring-expense";
import { EXPENSE_CATEGORIES } from "@/lib/validators/expense";
import { createRecurringExpense, updateRecurringExpense } from "./actions";
import type { RecurringExpenseData } from "./recurring-expense-page-client";

interface Props {
  onClose: () => void;
  existingTemplate?: RecurringExpenseData;
}

export function RecurringExpenseForm({ onClose, existingTemplate }: Props) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingTemplate;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RecurringExpenseInput>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: existingTemplate
      ? {
          description: existingTemplate.description,
          amount: existingTemplate.amount,
          category: existingTemplate.category,
          frequency: existingTemplate.frequency as RecurringExpenseInput["frequency"],
        }
      : {
          description: "",
          amount: 0,
          category: "",
          frequency: "MENSAL",
        },
  });

  async function onSubmit(data: RecurringExpenseInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateRecurringExpense(existingTemplate.id, data)
      : await createRecurringExpense(data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar modelo" : "Novo modelo de despesa"}
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

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Limpeza escadas"
              {...register("description")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Category & Frequency */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Categoria
              </label>
              <select
                {...register("category")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.category.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Frequência
              </label>
              <select
                {...register("frequency")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                {Object.entries(FREQUENCY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                €
              </span>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register("amount", { valueAsNumber: true })}
                className="w-full rounded-lg border border-input bg-background py-2 pl-7 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-xs text-destructive">
                {errors.amount.message}
              </p>
            )}
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
              {isSubmitting ? "A guardar..." : isEditing ? "Guardar" : "Criar modelo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
