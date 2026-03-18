"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsvUnits } from "@/lib/csv-import";
import { revalidatePath } from "next/cache";

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

/**
 * Import units from CSV text.
 * Creates units that don't already exist (by identifier).
 * Optionally assigns owners if ownerEmail column is present and user exists.
 */
export async function importUnitsFromCsv(condominiumId: string, csvText: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

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

  const { units, errors } = parseCsvUnits(csvText);

  if (units.length === 0) {
    return { error: errors.length > 0 ? errors.join("; ") : "Nenhuma fração encontrada no CSV" };
  }

  let created = 0;
  let skipped = 0;
  const importErrors: string[] = [...errors];

  for (const unit of units) {
    // Check if unit already exists
    const existing = await db.unit.findUnique({
      where: {
        condominiumId_identifier: {
          condominiumId,
          identifier: unit.identifier,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Find owner by email if provided
    let ownerId: string | null = null;
    if (unit.ownerEmail) {
      const owner = await db.user.findUnique({
        where: { email: unit.ownerEmail },
      });
      if (owner) {
        ownerId = owner.id;
      } else {
        importErrors.push(`Proprietário '${unit.ownerEmail}' não encontrado para ${unit.identifier}`);
      }
    }

    await db.unit.create({
      data: {
        condominiumId,
        identifier: unit.identifier,
        floor: unit.floor || null,
        typology: unit.typology || null,
        permilagem: unit.permilagem,
        ownerId,
      },
    });
    created++;
  }

  revalidatePath("/definicoes");
  return {
    success: true,
    created,
    skipped,
    errors: importErrors,
    message: `${created} fração${created !== 1 ? "ões" : ""} importada${created !== 1 ? "s" : ""}${skipped > 0 ? ` (${skipped} já existente${skipped !== 1 ? "s" : ""})` : ""}`,
  };
}

/**
 * Assign an owner or tenant to a unit.
 */
export async function assignUnitMember(
  unitId: string,
  userId: string | null,
  role: "owner" | "tenant"
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;
  if (!condominiumId) return { error: "Nenhum condomínio selecionado" };

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

  const unit = await db.unit.findFirst({
    where: { id: unitId, condominiumId },
  });

  if (!unit) return { error: "Fração não encontrada" };

  await db.unit.update({
    where: { id: unitId },
    data: role === "owner" ? { ownerId: userId } : { tenantId: userId },
  });

  revalidatePath("/definicoes");
  return { success: true };
}

/**
 * Update a unit's permilagem.
 */
export async function updateUnitPermilagem(unitId: string, permilagem: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;
  if (!condominiumId) return { error: "Nenhum condomínio selecionado" };

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

  if (permilagem < 0 || permilagem > 1000) {
    return { error: "Permilagem deve estar entre 0 e 1000" };
  }

  await db.unit.update({
    where: { id: unitId },
    data: { permilagem },
  });

  revalidatePath("/definicoes");
  return { success: true };
}
