"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseCsvUnits } from "@/lib/csv-import";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/email";
import { notificationPreferencesSchema, NOTIFICATION_DEFAULTS } from "@/lib/validators/notification-preferences";
import { generateUniqueSlug } from "@/lib/utils/slug";

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

  const condominium = await db.condominium.findUnique({
    where: { id: data.condominiumId },
    select: { name: true },
  });

  const invite = await db.invite.create({
    data: {
      condominiumId: data.condominiumId,
      role: data.role,
      email: data.email || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  if (data.email && condominium) {
    try {
      await sendInviteEmail(data.email, invite.token, condominium.name, data.role);
    } catch {
      // Email failure is non-fatal — the admin can still share the token manually.
    }
  }

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

  // Get condominium name for invite emails
  const condominium = await db.condominium.findUnique({
    where: { id: condominiumId },
    select: { name: true },
  });

  let created = 0;
  let skipped = 0;
  let invited = 0;
  const importErrors: string[] = [...errors];
  const invitedEmails = new Set<string>();

  for (const unit of units) {
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

    let ownerId: string | null = null;
    let pendingOwnerEmail: string | null = null;

    if (unit.ownerEmail) {
      const owner = await db.user.findUnique({
        where: { email: unit.ownerEmail },
      });
      if (owner) {
        ownerId = owner.id;
      } else {
        pendingOwnerEmail = unit.ownerEmail;

        if (!invitedEmails.has(unit.ownerEmail)) {
          try {
            const invite = await db.invite.create({
              data: {
                condominiumId,
                role: "OWNER",
                email: unit.ownerEmail,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
            });
            if (condominium) {
              sendInviteEmail(unit.ownerEmail, invite.token, condominium.name, "OWNER").catch(() => {});
            }
            invitedEmails.add(unit.ownerEmail);
            invited++;
          } catch {
            importErrors.push(`Erro ao convidar '${unit.ownerEmail}' para ${unit.identifier}`);
          }
        }
      }
    }

    await db.unit.create({
      data: {
        condominiumId,
        identifier: unit.identifier,
        floor: unit.floor ?? null,
        typology: unit.typology || null,
        permilagem: unit.permilagem,
        ownerId,
        pendingOwnerEmail,
      },
    });
    created++;
  }

  revalidatePath(`/c/`);

  const parts: string[] = [];
  parts.push(`${created} fração${created !== 1 ? "ões" : ""} importada${created !== 1 ? "s" : ""}`);
  if (skipped > 0) parts.push(`${skipped} já existente${skipped !== 1 ? "s" : ""}`);
  if (invited > 0) parts.push(`${invited} convite${invited !== 1 ? "s" : ""} enviado${invited !== 1 ? "s" : ""}`);

  return {
    success: true,
    created,
    skipped,
    invited,
    errors: importErrors,
    message: parts.join(", "),
  };
}

/**
 * Assign an owner or tenant to a unit.
 */
export async function assignUnitMember(
  condominiumId: string,
  unitId: string,
  userId: string | null,
  role: "owner" | "tenant"
) {
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

  const unit = await db.unit.findFirst({
    where: { id: unitId, condominiumId },
  });

  if (!unit) return { error: "Fração não encontrada" };

  await db.unit.update({
    where: { id: unitId },
    data: role === "owner" ? { ownerId: userId } : { tenantId: userId },
  });

  revalidatePath(`/c/`);
  return { success: true };
}

/**
 * Update condominium basic info (admin only).
 * Regenerates slug if name changes.
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

  // Check if name changed — regenerate slug if so
  const current = await db.condominium.findUnique({
    where: { id: condominiumId },
    select: { name: true, slug: true },
  });

  let slug = current?.slug;
  if (current && data.name.trim() !== current.name) {
    slug = await generateUniqueSlug(data.name.trim(), async (s) => {
      const existing = await db.condominium.findUnique({ where: { slug: s } });
      return !!existing && existing.id !== condominiumId;
    });
  }

  await db.condominium.update({
    where: { id: condominiumId },
    data: {
      name: data.name.trim(),
      slug,
      address: data.address.trim(),
      city: data.city?.trim() || null,
      nif: data.nif?.trim() || null,
    },
  });

  revalidatePath(`/c/`);
  return { success: true, slug };
}

/**
 * Update a unit's identifier (name). Admin only.
 */
export async function updateUnitIdentifier(condominiumId: string, unitId: string, identifier: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const membership = await db.membership.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });
  if (!membership || membership.role !== "ADMIN") return { error: "Sem permissão" };

  if (!identifier?.trim()) return { error: "Identificação é obrigatória" };

  const unit = await db.unit.findFirst({ where: { id: unitId, condominiumId } });
  if (!unit) return { error: "Fração não encontrada" };

  try {
    await db.unit.update({ where: { id: unitId }, data: { identifier: identifier.trim() } });
  } catch {
    return { error: "Já existe uma fração com esta identificação" };
  }

  revalidatePath(`/c/`);
  return { success: true };
}

/**
 * Update a unit's permilagem.
 */
export async function updateUnitPermilagem(condominiumId: string, unitId: string, permilagem: number) {
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

  if (permilagem < 0 || permilagem > 1000) {
    return { error: "Permilagem deve estar entre 0 e 1000" };
  }

  await db.unit.update({
    where: { id: unitId },
    data: { permilagem },
  });

  revalidatePath(`/c/`);
  return { success: true };
}

/**
 * Get notification preferences for the current user and condominium.
 */
export async function getNotificationPreferences(condominiumId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const pref = await db.notificationPreference.findUnique({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
  });

  if (!pref) {
    return { ...NOTIFICATION_DEFAULTS };
  }

  return {
    quotas: pref.quotas,
    announcements: pref.announcements,
    meetings: pref.meetings,
    maintenance: pref.maintenance,
    contracts: pref.contracts,
  };
}

/**
 * Save notification preferences for the current user and condominium.
 */
export async function saveNotificationPreferences(condominiumId: string, data: Record<string, boolean>) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Não autenticado" };

  const parsed = notificationPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  await db.notificationPreference.upsert({
    where: { userId_condominiumId: { userId: session.user.id, condominiumId } },
    create: {
      userId: session.user.id,
      condominiumId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  revalidatePath(`/c/`);
  return { success: true };
}
