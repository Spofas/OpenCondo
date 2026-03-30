import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Server-component helper that enforces authentication and condominium membership
 * for slug-based routes. Resolves the condominium from the slug and verifies membership.
 */
export async function requireMembership(slug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const condominium = await db.condominium.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!condominium) redirect("/iniciar");

  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: condominium.id,
      },
    },
  });

  if (!membership) redirect("/iniciar");

  return { session, membership, condominiumId: condominium.id };
}

/**
 * Same as requireMembership but includes the condominium record.
 */
export async function requireMembershipWithCondo(slug: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const condominium = await db.condominium.findUnique({ where: { slug } });
  if (!condominium) redirect("/iniciar");

  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: condominium.id,
      },
    },
    include: { condominium: true },
  });

  if (!membership) redirect("/iniciar");

  return { session, membership };
}
