import { cookies } from "next/headers";
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
 * Gets the authenticated member's context (any role).
 * Returns { userId, condominiumId, role } or null if not authenticated.
 */
export async function getMemberContext(): Promise<MemberContext | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  const membership = condominiumId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId,
          },
        },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!membership) return null;

  return {
    userId: session.user.id,
    condominiumId: membership.condominiumId,
    role: membership.role as "ADMIN" | "OWNER" | "TENANT",
  };
}

/**
 * Shared admin context check used by all server actions that require ADMIN role.
 * Returns { userId, condominiumId } or null if the user is not an authenticated admin.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const ctx = await getMemberContext();
  if (!ctx || ctx.role !== "ADMIN") return null;
  return { userId: ctx.userId, condominiumId: ctx.condominiumId };
}

/**
 * Higher-order function that wraps a server action with admin auth check.
 * Eliminates the repetitive `getAdminContext()` + null check boilerplate.
 *
 * Usage:
 *   export const createExpense = withAdmin(async (ctx, input: ExpenseInput) => {
 *     // ctx is guaranteed to be a valid AdminContext here
 *     ...
 *     return { success: true };
 *   });
 */
export function withAdmin<TArgs extends unknown[]>(
  fn: (ctx: AdminContext, ...args: TArgs) => Promise<ActionReturn>,
): (...args: TArgs) => Promise<ActionReturn> {
  return async (...args: TArgs) => {
    const ctx = await getAdminContext();
    if (!ctx) return { error: "Sem permissão" };
    return fn(ctx, ...args);
  };
}

/**
 * Higher-order function that wraps a server action with member auth check.
 * Any authenticated member of the active condominium can call the action.
 */
export function withMember<TArgs extends unknown[]>(
  fn: (ctx: MemberContext, ...args: TArgs) => Promise<ActionReturn>,
): (...args: TArgs) => Promise<ActionReturn> {
  return async (...args: TArgs) => {
    const ctx = await getMemberContext();
    if (!ctx) return { error: "Sem permissão" };
    return fn(ctx, ...args);
  };
}
