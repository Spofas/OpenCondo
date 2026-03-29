import { z } from "zod/v4";

export const notificationPreferencesSchema = z.object({
  quotas: z.boolean(),
  announcements: z.boolean(),
  meetings: z.boolean(),
  maintenance: z.boolean(),
  contracts: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof notificationPreferencesSchema>;

export const NOTIFICATION_TYPES = [
  { key: "quotas" as const, label: "Quotas", description: "Lembretes de quotas pendentes e vencidas" },
  { key: "announcements" as const, label: "Avisos", description: "Novos avisos publicados no condomínio" },
  { key: "meetings" as const, label: "Assembleias", description: "Convocatórias e agendamento de assembleias" },
  { key: "maintenance" as const, label: "Manutenção", description: "Atualizações de pedidos de manutenção" },
  { key: "contracts" as const, label: "Contratos", description: "Alertas de renovação e expiração de contratos" },
] as const;

export const NOTIFICATION_DEFAULTS: Record<string, boolean> = {
  quotas: true,
  announcements: true,
  meetings: true,
  maintenance: false,
  contracts: false,
};
