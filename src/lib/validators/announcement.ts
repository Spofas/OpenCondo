import { z } from "zod";

export const ANNOUNCEMENT_CATEGORIES = [
  "GERAL",
  "OBRAS",
  "MANUTENCAO",
  "ASSEMBLEIA",
  "URGENTE",
] as const;

export const announcementSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(200, "Título demasiado longo"),
  body: z.string().min(1, "Conteúdo é obrigatório").max(50000, "Conteúdo demasiado longo"),
  category: z.enum(ANNOUNCEMENT_CATEGORIES, { message: "Categoria é obrigatória" }),
  pinned: z.boolean().optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const CATEGORY_LABELS: Record<string, string> = {
  GERAL: "Geral",
  OBRAS: "Obras",
  MANUTENCAO: "Manutenção",
  ASSEMBLEIA: "Assembleia",
  URGENTE: "Urgente",
};
