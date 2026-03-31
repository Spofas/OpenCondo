import { db } from "@/lib/db";

/**
 * Resolves the membership for a user in a specific condominium.
 * Returns null if no membership is found.
 */
export async function getUserMembership(userId: string, condominiumId: string) {
  return db.membership.findUnique({
    where: { userId_condominiumId: { userId, condominiumId } },
  });
}

/**
 * Same as getUserMembership but also includes the condominium record.
 */
export async function getUserMembershipWithCondo(userId: string, condominiumId: string) {
  return db.membership.findUnique({
    where: { userId_condominiumId: { userId, condominiumId } },
    include: { condominium: true },
  });
}
