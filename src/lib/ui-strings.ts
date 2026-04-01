/**
 * Common UI strings — single source of truth for repeated button labels and messages.
 * Import these instead of hardcoding Portuguese strings across components.
 */
export const UI = {
  // Button labels
  save: "Guardar",
  cancel: "Cancelar",
  delete: "Eliminar",
  edit: "Editar",
  close: "Fechar",

  // Loading states
  saving: "A guardar...",
  deleting: "A eliminar...",
  generating: "A gerar...",

  // Delete confirmation
  confirmDelete: "Tem a certeza?",
  confirmYes: "Sim, eliminar",
  confirmNo: "Não",
} as const;

/**
 * Common error/permission messages used across API routes and server actions.
 */
export const ERRORS = {
  unauthorized: "Não autorizado",
  noPermission: "Sem permissão",
  notFound: "Não encontrado",
  tooManyRequests: "Demasiados pedidos. Tente novamente mais tarde.",
  serverError: "Erro interno do servidor",
} as const;
