import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { ActionReturn } from "@/lib/action-result";

export type MemberContext = {
  userId: string;
  condominiumId: string;
  role: "ADMIN" | "OWNER" | "TENANT";
};

export type AdminContext = {
  userId: string;
  condominiumId: string;
};

/**
 * Gets the authenticated member's context for a specific condominium.
 */
export async function getMemberContext(condominiumId: string): Promise<MemberContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId,
      },
    },
  });

  if (!membership) return null;

  return {
    userId: session.user.id,
    condominiumId: membership.condominiumId,
    role: membership.role as "ADMIN" | "OWNER" | "TENANT",
  };
}

/**
 * Gets the admin context for a specific condominium.
 */
export async function getAdminContext(condominiumId: string): Promise<AdminContext | null> {
  const ctx = await getMemberContext(condominiumId);
  if (!ctx || ctx.role !== "ADMIN") return null;
  return { userId: ctx.userId, condominiumId: ctx.condominiumId };
}

/**
 * Higher-order function that wraps a server action with admin auth check.
 * The first argument to the returned function is always the condominiumId.
 *
 * Usage:
 *   export const createExpense = withAdmin(async (ctx, input: ExpenseInput) => {
 *     ...
 *     return { success: true };
 *   });
 *   // Called as: createExpense(condominiumId, input)
 */
export function withAdmin<TArgs extends unknown[]>(
  fn: (ctx: AdminContext, ...args: TArgs) => Promise<ActionReturn>,
): (condominiumId: string, ...args: TArgs) => Promise<ActionReturn> {
  return async (condominiumId: string, ...args: TArgs) => {
    const ctx = await getAdminContext(condominiumId);
    if (!ctx) return { error: "Sem permissão" };
    return fn(ctx, ...args);
  };
}

/**
 * Higher-order function that wraps a server action with member auth check.
 * The first argument to the returned function is always the condominiumId.
 */
export function withMember<TArgs extends unknown[]>(
  fn: (ctx: MemberContext, ...args: TArgs) => Promise<ActionReturn>,
): (condominiumId: string, ...args: TArgs) => Promise<ActionReturn> {
  return async (condominiumId: string, ...args: TArgs) => {
    const ctx = await getMemberContext(condominiumId);
    if (!ctx) return { error: "Sem permissão" };
    return fn(ctx, ...args);
  };
}
