"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { documentSchema, type DocumentInput } from "@/lib/validators/document";
import { revalidatePath } from "next/cache";

async function getAdminContext() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  const membership = condominiumId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId,
          },
        },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!membership || membership.role !== "ADMIN") return null;

  return { userId: session.user.id, condominiumId: membership.condominiumId };
}

export async function createDocument(input: DocumentInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { name, category, fileUrl, fileName, fileSize, visibility } = parsed.data;

  await db.document.create({
    data: {
      condominiumId: ctx.condominiumId,
      name,
      category: category as "ATAS" | "ORCAMENTOS" | "SEGUROS" | "CONTRATOS" | "REGULAMENTOS" | "OUTROS",
      fileUrl,
      fileName,
      fileSize: fileSize || null,
      visibility: (visibility as "ALL" | "ADMIN_ONLY") || "ALL",
    },
  });

  revalidatePath("/comunicacao/documentos");
  return { success: true };
}

export async function updateDocument(documentId: string, input: DocumentInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const doc = await db.document.findFirst({
    where: { id: documentId, condominiumId: ctx.condominiumId },
  });

  if (!doc) return { error: "Documento não encontrado" };

  const { name, category, fileUrl, fileName, fileSize, visibility } = parsed.data;

  await db.document.update({
    where: { id: documentId },
    data: {
      name,
      category: category as "ATAS" | "ORCAMENTOS" | "SEGUROS" | "CONTRATOS" | "REGULAMENTOS" | "OUTROS",
      fileUrl,
      fileName,
      fileSize: fileSize || null,
      visibility: (visibility as "ALL" | "ADMIN_ONLY") || "ALL",
    },
  });

  revalidatePath("/comunicacao/documentos");
  return { success: true };
}

export async function deleteDocument(documentId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const doc = await db.document.findFirst({
    where: { id: documentId, condominiumId: ctx.condominiumId },
  });

  if (!doc) return { error: "Documento não encontrado" };

  await db.document.delete({ where: { id: documentId } });

  revalidatePath("/comunicacao/documentos");
  return { success: true };
}
