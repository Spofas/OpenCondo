import { z } from "zod";

export const DOCUMENT_CATEGORIES = [
  "ATAS",
  "ORCAMENTOS",
  "SEGUROS",
  "CONTRATOS",
  "REGULAMENTOS",
  "OUTROS",
] as const;

export const DOCUMENT_VISIBILITY = ["ALL", "ADMIN_ONLY"] as const;

export const documentSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  fileUrl: z.string().min(1, "URL do ficheiro é obrigatória"),
  fileName: z.string().min(1, "Nome do ficheiro é obrigatório"),
  fileSize: z.number().optional(),
  visibility: z.string().optional(),
});

export type DocumentInput = z.infer<typeof documentSchema>;

export const CATEGORY_LABELS: Record<string, string> = {
  ATAS: "Atas",
  ORCAMENTOS: "Orçamentos",
  SEGUROS: "Seguros",
  CONTRATOS: "Contratos",
  REGULAMENTOS: "Regulamentos",
  OUTROS: "Outros",
};

export const VISIBILITY_LABELS: Record<string, string> = {
  ALL: "Todos",
  ADMIN_ONLY: "Apenas administradores",
};
