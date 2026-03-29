import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Resolves the active membership for a user from the current request cookie.
 * Prefers the `activeCondominiumId` cookie; falls back to the first active membership.
 * Returns null if no membership is found.
 */
export async function getUserMembership(userId: string) {
  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  return condominiumId
    ? db.membership.findUnique({
        where: { userId_condominiumId: { userId, condominiumId } },
      })
    : db.membership.findFirst({
        where: { userId, isActive: true },
        orderBy: { joinedAt: "asc" },
      });
}

/**
 * Same as getUserMembership but also includes the condominium record.
 * Use this on pages that need to display condominium details directly.
 */
export async function getUserMembershipWithCondo(userId: string) {
  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  return condominiumId
    ? db.membership.findUnique({
        where: { userId_condominiumId: { userId, condominiumId } },
        include: { condominium: true },
      })
    : db.membership.findFirst({
        where: { userId, isActive: true },
        orderBy: { joinedAt: "asc" },
        include: { condominium: true },
      });
}
