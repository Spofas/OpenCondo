"use server";

import { db } from "@/lib/db";
import { documentSchema, type DocumentInput } from "@/lib/validators/document";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

export const createDocument = withAdmin(async (ctx, input: DocumentInput) => {
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
});

export const updateDocument = withAdmin(async (ctx, documentId: string, input: DocumentInput) => {
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
});

export const deleteDocument = withAdmin(async (ctx, documentId: string) => {
  const doc = await db.document.findFirst({
    where: { id: documentId, condominiumId: ctx.condominiumId },
  });

  if (!doc) return { error: "Documento não encontrado" };

  await db.document.delete({ where: { id: documentId } });

  revalidatePath("/comunicacao/documentos");
  return { success: true };
});
