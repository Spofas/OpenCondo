"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function joinWithInvite(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  const invite = await db.invite.findUnique({
    where: { token },
    include: { condominium: true },
  });

  if (!invite) {
    return { error: "Código de convite inválido" };
  }

  if (invite.usedAt) {
    return { error: "Este convite já foi utilizado" };
  }

  if (invite.expiresAt < new Date()) {
    return { error: "Este convite expirou" };
  }

  // If the invite is email-restricted, check it matches
  if (invite.email && invite.email !== session.user.email) {
    return { error: "Este convite não é válido para o seu email" };
  }

  // Check if already a member of this condominium
  const existingMembership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: invite.condominiumId,
      },
    },
  });

  if (existingMembership) {
    return { error: "Já é membro deste condomínio" };
  }

  // Use transaction to create membership and mark invite as used
  await db.$transaction([
    db.membership.create({
      data: {
        userId: session.user.id,
        condominiumId: invite.condominiumId,
        role: invite.role,
      },
    }),
    db.invite.update({
      where: { id: invite.id },
      data: {
        usedAt: new Date(),
        usedByUserId: session.user.id,
      },
    }),
  ]);

  // Set active condominium cookie so the dashboard knows which condo to show
  const cookieStore = await cookies();
  cookieStore.set("activeCondominiumId", invite.condominiumId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  return { success: true, condominiumName: invite.condominium.name };
}
