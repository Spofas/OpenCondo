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
  date: z.string().min(1, "Data é obrigatória").max(20),
  description: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição demasiado longa"),
  amount: z
    .number({ message: "Valor é obrigatório" })
    .positive("Valor deve ser positivo"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Categoria é obrigatória" }),
  notes: z.string().max(2000, "Notas demasiado longas").optional(),
  invoiceUrl: z.string().max(2048).optional(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
