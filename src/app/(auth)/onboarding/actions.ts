"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { condominiumSchema, unitsArraySchema } from "@/lib/validators/condominium";

export async function createCondominiumWithUnits(
  condominiumData: unknown,
  unitsData: unknown
) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Não autenticado" };
  }

  const condoParsed = condominiumSchema.safeParse(condominiumData);
  if (!condoParsed.success) {
    return { error: condoParsed.error.issues[0].message };
  }

  const unitsParsed = unitsArraySchema.safeParse(unitsData);
  if (!unitsParsed.success) {
    return { error: unitsParsed.error.issues[0].message };
  }

  const condo = condoParsed.data;
  const units = unitsParsed.data;

  // Check total permilagem if using permilagem model
  if (condo.quotaModel === "PERMILAGEM") {
    const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);
    if (totalPermilagem !== 1000) {
      return {
        error: `A soma da permilagem deve ser 1000 (atual: ${totalPermilagem})`,
      };
    }
  }

  try {
    const result = await db.$transaction(async (tx) => {
      // Create the condominium
      const condominium = await tx.condominium.create({
        data: {
          name: condo.name,
          address: condo.address,
          postalCode: condo.postalCode || null,
          city: condo.city || null,
          nif: condo.nif || null,
          quotaModel: condo.quotaModel,
          totalPermilagem: condo.quotaModel === "PERMILAGEM" ? 1000 : 0,
        },
      });

      // Create membership for the current user as ADMIN
      await tx.membership.create({
        data: {
          userId: session.user.id,
          condominiumId: condominium.id,
          role: "ADMIN",
        },
      });

      // Create units
      await tx.unit.createMany({
        data: units.map((unit) => ({
          condominiumId: condominium.id,
          identifier: unit.identifier,
          floor: unit.floor || null,
          typology: unit.typology || null,
          permilagem:
            condo.quotaModel === "PERMILAGEM" ? unit.permilagem : 0,
        })),
      });

      return condominium;
    });

    return { success: true, condominiumId: result.id };
  } catch (err) {
    console.error("createCondominiumWithUnits transaction error:", err);
    return { error: "Erro ao criar o condomínio. Tente novamente." };
  }
  } catch (err) {
    console.error("createCondominiumWithUnits top-level error:", err);
    return { error: "Erro inesperado no servidor." };
  }
}
