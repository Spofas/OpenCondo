import { z } from "zod";

export const openingBalanceSchema = z.object({
  amount: z
    .number()
    .min(0, "O saldo inicial deve ser igual ou superior a 0"),
  date: z.string().min(1, "Data obrigatória").max(20),
  description: z.string().max(2000, "Descrição demasiado longa").optional(),
});

export const adjustmentSchema = z.object({
  amount: z
    .number()
    .refine((v) => v !== 0, "O valor não pode ser zero"),
  date: z.string().min(1, "Data obrigatória").max(20),
  description: z.string().min(1, "Descrição obrigatória").max(2000, "Descrição demasiado longa"),
});

export type OpeningBalanceInput = z.infer<typeof openingBalanceSchema>;
export type AdjustmentInput = z.infer<typeof adjustmentSchema>;
