import { z } from "zod/v4";

export const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  category: z.string().min(1, "Categoria é obrigatória"),
  notes: z.string().optional(),
  visibility: z.enum(["ALL", "ADMIN_ONLY"]),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const CONTACT_CATEGORIES = [
  { value: "emergencia", label: "Emergência" },
  { value: "servicos", label: "Serviços (água, luz, gás)" },
  { value: "manutencao", label: "Manutenção" },
  { value: "limpeza", label: "Limpeza" },
  { value: "elevador", label: "Elevador" },
  { value: "seguranca", label: "Segurança" },
  { value: "jardinagem", label: "Jardinagem" },
  { value: "seguros", label: "Seguros" },
  { value: "administracao", label: "Administração" },
  { value: "juridico", label: "Jurídico" },
  { value: "outros", label: "Outros" },
] as const;
