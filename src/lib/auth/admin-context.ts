import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Resolve the authenticated user's membership for the active condominium.
 * Returns { userId, condominiumId, role } or null if not authenticated/no membership.
 * Used by actions that any authenticated member can perform.
 */
export async function getMemberContext() {
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
export async function getAdminContext() {
  const ctx = await getMemberContext();
  if (!ctx || ctx.role !== "ADMIN") return null;
  return { userId: ctx.userId, condominiumId: ctx.condominiumId };
}
