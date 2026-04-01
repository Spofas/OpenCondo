import { z } from "zod/v4";

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

const CONTACT_CATEGORY_VALUES = CONTACT_CATEGORIES.map((c) => c.value) as unknown as readonly [string, ...string[]];

export const contactSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(200, "Nome demasiado longo"),
  phone: z.string().max(30).optional(),
  email: z.string().email("Email inválido").max(254).optional().or(z.literal("")),
  category: z.enum(CONTACT_CATEGORY_VALUES, { message: "Categoria é obrigatória" }),
  notes: z.string().max(2000, "Notas demasiado longas").optional(),
  visibility: z.enum(["ALL", "ADMIN_ONLY"]),
});

export type ContactInput = z.infer<typeof contactSchema>;
