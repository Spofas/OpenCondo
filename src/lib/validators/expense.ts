import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "Limpeza",
  "Elevador",
  "Eletricidade",
  "Água",
  "Seguro",
  "Manutenção",
  "Jardinagem",
  "Segurança",
  "Administração",
  "Obras",
  "Jurídico",
  "Outros",
] as const;

export const expenseSchema = z.object({
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z
    .number({ message: "Valor é obrigatório" })
    .positive("Valor deve ser positivo"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Categoria é obrigatória" }),
  notes: z.string().optional(),
  invoiceUrl: z.string().optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
