"use server";

import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Generate a password reset token for the given email.
 * In production this would send an email; in dev the token is returned
 * directly so it can be displayed in the UI.
 */
export async function requestPasswordReset(email: string) {
  const user = await db.user.findUnique({ where: { email } });

  // Always return success to avoid leaking which emails are registered.
  if (!user || !user.passwordHash) {
    return { success: true };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
    },
  });

  // TODO: send email in production.
  // For now, return the token so it can be displayed in dev.
  return { success: true, devToken: token };
}

/**
 * Consume a reset token and update the user's password.
 */
export async function resetPassword(token: string, newPassword: string) {
  if (!token || !newPassword || newPassword.length < 8) {
    return { error: "Dados inválidos" };
  }

  const user = await db.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiresAt: { gt: new Date() },
    },
  });

  if (!user) {
    return { error: "Link inválido ou expirado. Solicite um novo." };
  }

  const passwordHash = await hash(newPassword, 12);

  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    },
  });

  return { success: true };
}
