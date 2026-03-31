/**
 * Standardized return type for all server actions.
 *
 * Every action returns either a success payload or an error string.
 * Client components can check: `if ("error" in result) { ... }`.
 *
 * The generic parameter T allows actions to attach extra data on success
 * (e.g., `{ success: true, created: 5, message: "..." }`).
 */
export type ActionResult<T extends Record<string, unknown> = Record<string, never>> =
  | ({ success: true } & T)
  | { error: string };

/**
 * Broad action return type used by withAdmin/withMember HOFs.
 * Uses a discriminated union on the `success` / `error` keys.
 */
export type ActionReturn =
  | { success: true; error?: never; [key: string]: unknown }
  | { error: string; success?: never };
