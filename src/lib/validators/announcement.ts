import { z } from "zod";

export const ANNOUNCEMENT_CATEGORIES = [
  "GERAL",
  "OBRAS",
  "MANUTENCAO",
  "ASSEMBLEIA",
  "URGENTE",
] as const;

export const announcementSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  body: z.string().min(1, "Conteúdo é obrigatório"),
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
