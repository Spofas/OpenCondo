import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserMembership, getUserMembershipWithCondo } from "./get-membership";

/**
 * Server-component helper that enforces authentication and condominium membership.
 * Redirects to /login if unauthenticated, to /iniciar if no active membership.
 * Use this at the top of every dashboard page.tsx instead of repeating the
 * auth + membership check inline.
 */
export async function requireMembership() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  return { session, membership };
}

/**
 * Same as requireMembership but includes the condominium record.
 * Use on pages that render condominium details directly.
 */
export async function requireMembershipWithCondo() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembershipWithCondo(session.user.id);
  if (!membership) redirect("/iniciar");

  return { session, membership };
}
