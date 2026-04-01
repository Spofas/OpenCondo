import { z } from "zod";

// Common budget categories for Portuguese condominiums
export const BUDGET_CATEGORIES = [
  "Limpeza",
  "Elevador",
  "Eletricidade",
  "Água",
  "Seguro",
  "Manutenção",
  "Jardinagem",
  "Segurança",
  "Administração",
  "Fundo de reserva",
  "Obras",
  "Jurídico",
  "Outros",
] as const;

export const budgetItemSchema = z.object({
  id: z.string().optional(), // present when editing existing items
  category: z.enum(BUDGET_CATEGORIES, { message: "Categoria é obrigatória" }),
  description: z.string(),
  plannedAmount: z
    .number({ message: "Valor deve ser um número" })
    .positive("Valor deve ser positivo"),
});

export const budgetSchema = z.object({
  year: z
    .number({ message: "Ano é obrigatório" })
    .int()
    .min(2020, "Ano inválido")
    .max(2050, "Ano inválido"),
  reserveFundPercentage: z
    .number({ message: "Percentagem é obrigatória" })
    .min(0, "Mínimo 0%")
    .max(100, "Máximo 100%"),
  items: z.array(budgetItemSchema).min(1, "Adicione pelo menos uma rubrica"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;
export type BudgetItemInput = z.infer<typeof budgetItemSchema>;
