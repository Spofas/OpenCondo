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
 * Update condominium basic info (admin only).
 */
export async function updateCondominium(
  condominiumId: string,
  data: { name: string; address: string; city?: string; nif?: string }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const membership = await db.membership.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });
  if (!membership || membership.role !== "ADMIN") return { error: "Sem permissão" };

  if (!data.name?.trim() || !data.address?.trim()) {
    return { error: "Nome e morada são obrigatórios" };
  }

  await db.condominium.update({
    where: { id: condominiumId },
    data: {
      name: data.name.trim(),
      address: data.address.trim(),
      city: data.city?.trim() || null,
      nif: data.nif?.trim() || null,
    },
  });

  revalidatePath("/definicoes");
  return { success: true };
}

/**
 * Create a single unit.
 */
export async function createUnit(
  condominiumId: string,
  data: { identifier: string; floor?: string; typology?: string; permilagem: number }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const membership = await db.membership.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });
  if (!membership || membership.role !== "ADMIN") return { error: "Sem permissão" };

  if (!data.identifier?.trim()) return { error: "Identificação é obrigatória" };
  if (data.permilagem < 0 || data.permilagem > 1000) {
    return { error: "Permilagem deve estar entre 0 e 1000" };
  }

  const maxOrder = await db.unit.findFirst({
    where: { condominiumId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  try {
    await db.unit.create({
      data: {
        condominiumId,
        identifier: data.identifier.trim(),
        floor: data.floor?.trim() || null,
        typology: data.typology?.trim() || null,
        permilagem: data.permilagem,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });
  } catch {
    return { error: "Já existe uma fração com esta identificação" };
  }

  revalidatePath("/definicoes");
  return { success: true };
}

/**
 * Move a unit up or down in the sort order.
 */
export async function moveUnit(unitId: string, direction: "up" | "down") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;
  if (!condominiumId) return { error: "Nenhum condomínio selecionado" };

  const membership = await db.membership.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });
  if (!membership || membership.role !== "ADMIN") return { error: "Sem permissão" };

  // Load all units in display order, normalise indices
  const allUnits = await db.unit.findMany({
    where: { condominiumId },
    orderBy: [{ sortOrder: "asc" }, { identifier: "asc" }],
    select: { id: true },
  });

  const idx = allUnits.findIndex((u) => u.id === unitId);
  if (idx === -1) return { error: "Fração não encontrada" };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= allUnits.length) return { success: true };

  // Assign sequential sortOrders, then swap the two
  const orders = allUnits.map((_, i) => i);
  [orders[idx], orders[swapIdx]] = [orders[swapIdx], orders[idx]];

  await db.$transaction(
    allUnits.map((u, i) =>
      db.unit.update({ where: { id: u.id }, data: { sortOrder: orders[i] } })
    )
  );

  revalidatePath("/definicoes");
  return { success: true };
}

/**
 * Delete a unit (admin only). Blocked if it has associated quotas.
 */
export async function deleteUnit(unitId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;
  if (!condominiumId) return { error: "Nenhum condomínio selecionado" };

  const membership = await db.membership.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });
  if (!membership || membership.role !== "ADMIN") return { error: "Sem permissão" };

  const unit = await db.unit.findFirst({ where: { id: unitId, condominiumId } });
  if (!unit) return { error: "Fração não encontrada" };

  const quotaCount = await db.quota.count({ where: { unitId } });
  if (quotaCount > 0) {
    return {
      error: `Não é possível eliminar — fração tem ${quotaCount} quota(s) associada(s)`,
    };
  }

  await db.unit.delete({ where: { id: unitId } });
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
