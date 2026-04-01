import { z } from "zod";
import { EXPENSE_CATEGORIES } from "./expense";

export const recurringExpenseSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z
    .number({ message: "Valor é obrigatório" })
    .positive("Valor deve ser positivo"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Categoria é obrigatória" }),
  frequency: z.enum(["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]),
});

export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>;

export const FREQUENCY_LABELS: Record<string, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const FREQUENCY_MONTHS: Record<string, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};
