"use server";

import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
]);

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const condominiumId = request.nextUrl.searchParams.get("condominiumId");
  if (!condominiumId) {
    return NextResponse.json({ error: "condominiumId em falta" }, { status: 400 });
  }

  // Verify membership
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId,
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Nenhum ficheiro enviado" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "Ficheiro demasiado grande (máx. 10 MB)" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Tipo de ficheiro não suportado" },
      { status: 400 }
    );
  }

  // Upload to Vercel Blob
  const blob = await put(`${condominiumId}/${file.name}`, file, {
    access: "public",
  });

  return NextResponse.json({
    url: blob.url,
    fileName: file.name,
    fileSize: file.size,
  });
}
