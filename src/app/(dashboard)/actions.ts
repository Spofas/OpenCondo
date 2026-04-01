"use server";

import { db } from "@/lib/db";
import { parseCsvUnits } from "@/lib/csv-import";
import { revalidatePath } from "next/cache";
import { sendInviteEmail } from "@/lib/email";
import { notificationPreferencesSchema, NOTIFICATION_DEFAULTS } from "@/lib/validators/notification-preferences";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { withAdmin, withMember } from "@/lib/auth/admin-context";

export const createInvite = withAdmin(async (ctx, data: {
  role: "OWNER" | "TENANT";
  email?: string;
}) => {
  const condominium = await db.condominium.findUnique({
    where: { id: ctx.condominiumId },
    select: { name: true },
  });

  const invite = await db.invite.create({
    data: {
      condominiumId: ctx.condominiumId,
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
});

export const listInvites = withAdmin(async (ctx) => {
  const invites = await db.invite.findMany({
    where: { condominiumId: ctx.condominiumId },
    include: { usedByUser: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return { success: true, invites };
});

/**
 * Import units from CSV text.
 * Creates units that don't already exist (by identifier).
 * Optionally assigns owners if ownerEmail column is present and user exists.
 */
export const importUnitsFromCsv = withAdmin(async (ctx, csvText: string) => {
  const { units, errors } = parseCsvUnits(csvText);

  if (units.length === 0) {
    return { error: errors.length > 0 ? errors.join("; ") : "Nenhuma fração encontrada no CSV" };
  }

  // Get condominium name for invite emails
  const condominium = await db.condominium.findUnique({
    where: { id: ctx.condominiumId },
    select: { name: true },
  });

  // Batch-fetch existing units and owner emails upfront to avoid N+1 queries
  const existingUnits = new Set(
    (await db.unit.findMany({
      where: { condominiumId: ctx.condominiumId },
      select: { identifier: true },
    })).map((u) => u.identifier)
  );

  const ownerEmails = [...new Set(units.map((u) => u.ownerEmail).filter(Boolean))] as string[];
  const existingUsers = ownerEmails.length > 0
    ? new Map(
        (await db.user.findMany({
          where: { email: { in: ownerEmails } },
          select: { id: true, email: true },
        })).map((u) => [u.email, u.id])
      )
    : new Map<string, string>();

  let created = 0;
  let skipped = 0;
  let invited = 0;
  const importErrors: string[] = [...errors];
  const invitedEmails = new Set<string>();

  for (const unit of units) {
    if (existingUnits.has(unit.identifier)) {
      skipped++;
      continue;
    }

    let ownerId: string | null = null;
    let pendingOwnerEmail: string | null = null;

    if (unit.ownerEmail) {
      const existingUserId = existingUsers.get(unit.ownerEmail);
      if (existingUserId) {
        ownerId = existingUserId;
      } else {
        pendingOwnerEmail = unit.ownerEmail;

        if (!invitedEmails.has(unit.ownerEmail)) {
          try {
            const invite = await db.invite.create({
              data: {
                condominiumId: ctx.condominiumId,
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
        condominiumId: ctx.condominiumId,
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

  revalidatePath(`/c/${ctx.slug}`);

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
});

/**
 * Assign an owner or tenant to a unit.
 */
export const assignUnitMember = withAdmin(async (
  ctx,
  unitId: string,
  userId: string | null,
  role: "owner" | "tenant"
) => {
  const unit = await db.unit.findFirst({
    where: { id: unitId, condominiumId: ctx.condominiumId },
  });

  if (!unit) return { error: "Fração não encontrada" };

  await db.unit.update({
    where: { id: unitId },
    data: role === "owner" ? { ownerId: userId } : { tenantId: userId },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

/**
 * Update condominium basic info (admin only).
 * Regenerates slug if name changes.
 */
export const updateCondominium = withAdmin(async (
  ctx,
  data: { name: string; address: string; city?: string; nif?: string }
) => {
  if (!data.name?.trim() || !data.address?.trim()) {
    return { error: "Nome e morada são obrigatórios" };
  }

  // Check if name changed — regenerate slug if so
  const current = await db.condominium.findUnique({
    where: { id: ctx.condominiumId },
    select: { name: true, slug: true },
  });

  let slug = current?.slug;
  if (current && data.name.trim() !== current.name) {
    slug = await generateUniqueSlug(data.name.trim(), async (s) => {
      const existing = await db.condominium.findUnique({ where: { slug: s } });
      return !!existing && existing.id !== ctx.condominiumId;
    });
  }

  await db.condominium.update({
    where: { id: ctx.condominiumId },
    data: {
      name: data.name.trim(),
      slug,
      address: data.address.trim(),
      city: data.city?.trim() || null,
      nif: data.nif?.trim() || null,
    },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true, slug };
});

/**
 * Update a unit's identifier (name). Admin only.
 */
export const updateUnitIdentifier = withAdmin(async (ctx, unitId: string, identifier: string) => {
  if (!identifier?.trim()) return { error: "Identificação é obrigatória" };

  const unit = await db.unit.findFirst({ where: { id: unitId, condominiumId: ctx.condominiumId } });
  if (!unit) return { error: "Fração não encontrada" };

  try {
    await db.unit.update({ where: { id: unitId }, data: { identifier: identifier.trim() } });
  } catch {
    return { error: "Já existe uma fração com esta identificação" };
  }

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

/**
 * Update a unit's permilagem.
 */
export const updateUnitPermilagem = withAdmin(async (ctx, unitId: string, permilagem: number) => {
  if (permilagem < 0 || permilagem > 1000) {
    return { error: "Permilagem deve estar entre 0 e 1000" };
  }

  await db.unit.update({
    where: { id: unitId },
    data: { permilagem },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

/**
 * Save notification preferences for the current user and condominium.
 */
export const saveNotificationPreferences = withMember(async (ctx, data: Record<string, boolean>) => {
  const parsed = notificationPreferencesSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos" };

  await db.notificationPreference.upsert({
    where: { userId_condominiumId: { userId: ctx.userId, condominiumId: ctx.condominiumId } },
    create: {
      userId: ctx.userId,
      condominiumId: ctx.condominiumId,
      ...parsed.data,
    },
    update: parsed.data,
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});
