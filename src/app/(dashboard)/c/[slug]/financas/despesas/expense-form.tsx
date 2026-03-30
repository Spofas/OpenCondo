"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  expenseSchema,
  type ExpenseInput,
  EXPENSE_CATEGORIES,
} from "@/lib/validators/expense";
import { createExpense, updateExpense } from "./actions";
import { useCondominium } from "@/lib/condominium-context";
import type { ExpenseData } from "./expense-page-client";

interface ExpenseFormProps {
  onClose: () => void;
  existingExpense?: ExpenseData;
}

export function ExpenseForm({ onClose, existingExpense }: ExpenseFormProps) {
  const { condominiumId } = useCondominium();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!existingExpense;

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: existingExpense
      ? {
          date: existingExpense.date.split("T")[0],
          description: existingExpense.description,
          amount: existingExpense.amount,
          category: existingExpense.category,
          notes: existingExpense.notes || "",
        }
      : {
          date: today,
          description: "",
          amount: 0,
          category: "",
          notes: "",
        },
  });

  async function onSubmit(data: ExpenseInput) {
    setIsSubmitting(true);
    setError("");

    const result = isEditing
      ? await updateExpense(condominiumId, existingExpense.id, data)
      : await createExpense(condominiumId, data);

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-card md:bg-black/50 md:flex md:items-start md:justify-center md:p-4 md:pt-16">
      <div className="w-full md:max-w-lg md:rounded-xl md:border md:border-border bg-card md:shadow-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-card-foreground">
            {isEditing ? "Editar despesa" : "Registar despesa"}
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

          {/* Date & Category */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Data
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Categoria
              </label>
              <select
                {...register("category")}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecionar categoria</option>
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
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Descrição
            </label>
            <input
              type="text"
              placeholder="Ex: Fatura limpeza escadas"
              {...register("description")}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="mb-4">
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

          {/* Notes */}
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-foreground">
              Notas (opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Fatura n.º 12345"
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
                  : "Registar despesa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
