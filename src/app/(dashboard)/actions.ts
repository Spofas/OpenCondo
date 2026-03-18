"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function switchCondominium(condominiumId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  // Verify the user actually has a membership for this condominium
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId,
      },
    },
  });

  if (!membership || !membership.isActive) return;

  const cookieStore = await cookies();
  cookieStore.set("activeCondominiumId", condominiumId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
}

export async function createInvite(data: {
  condominiumId: string;
  role: "OWNER" | "TENANT";
  email?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  // Verify the user is an ADMIN of this condominium
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: data.condominiumId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    return { error: "Apenas administradores podem criar convites" };
  }

  const invite = await db.invite.create({
    data: {
      condominiumId: data.condominiumId,
      role: data.role,
      email: data.email || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { success: true, token: invite.token };
}

export async function listInvites(condominiumId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId,
      },
    },
  });

  if (!membership || membership.role !== "ADMIN") {
    return { error: "Sem permissão" };
  }

  const invites = await db.invite.findMany({
    where: { condominiumId },
    include: { usedByUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { invites };
}
