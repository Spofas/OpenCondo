"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Called immediately after a successful client-side signIn.
 * Reads the freshly-issued session server-side, finds the user's first
 * active membership, sets the activeCondominiumId cookie, and returns
 * where the client should navigate next.
 */
export async function resolvePostLoginDestination(): Promise<"/painel" | "/iniciar"> {
  const session = await auth();

  if (!session?.user?.id) {
    // Should not happen — signIn just succeeded — but be safe.
    return "/iniciar";
  }

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) {
    return "/iniciar";
  }

  const cookieStore = await cookies();
  cookieStore.set("activeCondominiumId", membership.condominiumId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return "/painel";
}
