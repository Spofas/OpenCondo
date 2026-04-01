import { z } from "zod";

export const condominiumSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200, "Nome demasiado longo"),
  address: z.string().min(5, "Morada é obrigatória").max(500, "Morada demasiado longa"),
  postalCode: z
    .string()
    .regex(/^\d{4}-\d{3}$/, "Formato: 1234-567")
    .optional()
    .or(z.literal("")),
  city: z.string().max(100, "Cidade demasiado longa").optional(),
  nif: z
    .string()
    .regex(/^\d{9}$/, "NIF deve ter 9 dígitos")
    .optional()
    .or(z.literal("")),
  quotaModel: z.enum(["PERMILAGEM", "EQUAL"]),
});

export const unitSchema = z.object({
  identifier: z.string().min(1, "Identificação é obrigatória").max(50, "Identificação demasiado longa"),
  floor: z.number().int().optional(),
  typology: z.string().max(50, "Tipologia demasiado longa").optional(),
  permilagem: z.number().int().min(0, "Permilagem deve ser >= 0"),
});

export const unitsArraySchema = z.array(unitSchema).min(1, "Adicione pelo menos uma fração");

export type CondominiumInput = z.infer<typeof condominiumSchema>;
export type UnitInput = z.infer<typeof unitSchema>;
