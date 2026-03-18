import { z } from "zod";

// Schema for setting quota configuration (how much each unit pays)
export const quotaConfigSchema = z.object({
  totalMonthlyAmount: z
    .number({ message: "Valor mensal é obrigatório" })
    .positive("Valor deve ser positivo"),
  splitMethod: z.enum(["PERMILAGEM", "EQUAL"], {
    message: "Método de divisão é obrigatório",
  }),
  dueDay: z
    .number({ message: "Dia de vencimento é obrigatório" })
    .int()
    .min(1, "Dia inválido")
    .max(28, "Dia máximo é 28"), // avoid month-end issues
});

export type QuotaConfigInput = z.infer<typeof quotaConfigSchema>;

// Schema for generating quota records for a period range
export const quotaGenerateSchema = z
  .object({
    startMonth: z.string().min(1, "Mês inicial é obrigatório"), // "2026-01"
    endMonth: z.string().min(1, "Mês final é obrigatório"), // "2026-12"
    totalMonthlyAmount: z
      .number({ message: "Valor mensal é obrigatório" })
      .positive("Valor deve ser positivo"),
    splitMethod: z.enum(["PERMILAGEM", "EQUAL"]),
    dueDay: z
      .number({ message: "Dia de vencimento é obrigatório" })
      .int()
      .min(1, "Dia inválido")
      .max(28, "Dia máximo é 28"),
    // Optional: override amounts per unit (manual mode)
    unitOverrides: z
      .array(
        z.object({
          unitId: z.string(),
          amount: z.number().positive("Valor deve ser positivo"),
        })
      )
      .optional(),
  })
  .refine(
    (data) => {
      return data.startMonth <= data.endMonth;
    },
    { message: "Mês inicial deve ser anterior ao mês final", path: ["endMonth"] }
  );

export type QuotaGenerateInput = z.infer<typeof quotaGenerateSchema>;

// Schema for recording a payment
export const quotaPaymentSchema = z.object({
  paymentDate: z.string().min(1, "Data de pagamento é obrigatória"),
  paymentMethod: z.enum(
    ["TRANSFERENCIA", "NUMERARIO", "CHEQUE", "MBWAY", "MULTIBANCO", "OUTRO"],
    { message: "Método de pagamento é obrigatório" }
  ),
  paymentNotes: z.string().optional(),
});

export type QuotaPaymentInput = z.infer<typeof quotaPaymentSchema>;

// Payment method display labels
export const PAYMENT_METHODS = [
  { value: "TRANSFERENCIA", label: "Transferência bancária" },
  { value: "NUMERARIO", label: "Numerário" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "MBWAY", label: "MB WAY" },
  { value: "MULTIBANCO", label: "Multibanco" },
  { value: "OUTRO", label: "Outro" },
] as const;
