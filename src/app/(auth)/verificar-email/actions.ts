"use server";

import { randomBytes, createHash } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

export async function resendVerificationEmail() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sessão inválida" };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return { error: "Utilizador não encontrado" };
  if (user.emailVerified) return { error: "Email já verificado" };

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.user.update({
    where: { id: user.id },
    data: {
      emailVerificationToken: tokenHash,
      emailVerificationExpiresAt: expiresAt,
    },
  });

  if (process.env.NODE_ENV === "production") {
    await sendVerificationEmail(user.email, token);
  } else {
    console.log(`[DEV] Email verification token for ${user.email}: ${token}`);
  }

  return { success: true };
}
