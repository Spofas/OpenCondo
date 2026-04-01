import { z } from "zod";

export const MAINTENANCE_PRIORITIES = ["BAIXA", "MEDIA", "ALTA", "URGENTE"] as const;
export const MAINTENANCE_STATUSES = ["SUBMETIDO", "EM_ANALISE", "EM_CURSO", "CONCLUIDO"] as const;

export const maintenanceSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título demasiado longo"),
  description: z.string().min(1, "Descrição é obrigatória").max(2000, "Descrição demasiado longa"),
  location: z.string().max(200, "Local demasiado longo").optional(),
  priority: z.enum(MAINTENANCE_PRIORITIES, { message: "Prioridade é obrigatória" }),
});

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export const maintenanceUpdateSchema = z.object({
  status: z.enum(MAINTENANCE_STATUSES, { message: "Estado é obrigatório" }),
  note: z.string().max(2000, "Nota demasiado longa").optional(),
});

export type MaintenanceUpdateInput = z.infer<typeof maintenanceUpdateSchema>;

export const PRIORITY_LABELS: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

export const STATUS_LABELS: Record<string, string> = {
  SUBMETIDO: "Submetido",
  EM_ANALISE: "Em análise",
  EM_CURSO: "Em curso",
  CONCLUIDO: "Concluído",
};
