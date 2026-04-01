import { z } from "zod";

export const CONTRACT_TYPES = [
  "Limpeza",
  "Elevador",
  "Seguro",
  "Jardinagem",
  "Segurança",
  "Administração",
  "Manutenção",
  "Outros",
] as const;

export const CONTRACT_STATUSES = ["ATIVO", "EXPIRADO", "RENOVADO", "CANCELADO"] as const;
export const RENEWAL_TYPES = ["AUTOMATICA", "MANUAL"] as const;
export const PAYMENT_FREQUENCIES = [
  "MENSAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "PONTUAL",
] as const;

export const contractSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória").max(200, "Descrição demasiado longa"),
  type: z.enum(CONTRACT_TYPES, { message: "Tipo é obrigatório" }),
  startDate: z.string().min(1, "Data de início é obrigatória").max(20),
  endDate: z.string().max(20).optional(),
  renewalType: z.enum(RENEWAL_TYPES).optional(),
  annualCost: z.number({ message: "Custo é obrigatório" }).positive("Custo deve ser positivo"),
  paymentFrequency: z.enum(PAYMENT_FREQUENCIES).optional(),
  notes: z.string().max(2000, "Notas demasiado longas").optional(),
  // Insurance-specific
  policyNumber: z.string().max(50).optional(),
  insuredValue: z.number().optional(),
  coverageType: z.string().max(200).optional(),
  // Document
  documentUrl: z.string().max(2048).optional(),
  // Supplier
  supplierName: z.string().max(200).optional(),
  supplierNif: z.string().max(20).optional(),
  supplierPhone: z.string().max(30).optional(),
  supplierEmail: z.string().max(254).optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;

export const STATUS_LABELS: Record<string, string> = {
  ATIVO: "Ativo",
  EXPIRADO: "Expirado",
  RENOVADO: "Renovado",
  CANCELADO: "Cancelado",
};

export const RENEWAL_LABELS: Record<string, string> = {
  AUTOMATICA: "Automática",
  MANUAL: "Manual",
};

export const FREQUENCY_LABELS: Record<string, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  PONTUAL: "Pontual",
};
