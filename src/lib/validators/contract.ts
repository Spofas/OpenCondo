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
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.string().min(1, "Tipo é obrigatório"),
  startDate: z.string().min(1, "Data de início é obrigatória"),
  endDate: z.string().optional(),
  renewalType: z.string().optional(),
  annualCost: z.number({ message: "Custo é obrigatório" }).positive("Custo deve ser positivo"),
  paymentFrequency: z.string().optional(),
  notes: z.string().optional(),
  // Insurance-specific
  policyNumber: z.string().optional(),
  insuredValue: z.number().optional(),
  coverageType: z.string().optional(),
  // Supplier
  supplierName: z.string().optional(),
  supplierNif: z.string().optional(),
  supplierPhone: z.string().optional(),
  supplierEmail: z.string().optional(),
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
