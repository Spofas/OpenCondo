"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Called immediately after a successful client-side signIn.
 * Reads the freshly-issued session, finds the user's first active membership,
 * and returns where the client should navigate next (slug-based URL).
 */
export async function resolvePostLoginDestination(): Promise<string> {
  const session = await auth();

  if (!session?.user?.id) {
    return "/iniciar";
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { condominium: { select: { slug: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    return "/iniciar";
  }

  return `/c/${membership.condominium.slug}/painel`;
}
