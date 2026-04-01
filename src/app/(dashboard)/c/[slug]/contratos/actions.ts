"use server";

import { db } from "@/lib/db";
import { contractSchema, type ContractInput } from "@/lib/validators/contract";
import { revalidatePath } from "next/cache";
import { withAdmin } from "@/lib/auth/admin-context";

export const createContract = withAdmin(async (ctx, input: ContractInput) => {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  // Create or find supplier if supplier info provided
  let supplierId: string | null = null;
  if (data.supplierName) {
    const supplier = await db.supplier.create({
      data: {
        condominiumId: ctx.condominiumId,
        name: data.supplierName,
        nif: data.supplierNif || null,
        phone: data.supplierPhone || null,
        email: data.supplierEmail || null,
        category: data.type,
      },
    });
    supplierId = supplier.id;
  }

  await db.contract.create({
    data: {
      condominiumId: ctx.condominiumId,
      supplierId,
      description: data.description,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      renewalType: (data.renewalType as "AUTOMATICA" | "MANUAL") || "MANUAL",
      annualCost: data.annualCost,
      paymentFrequency:
        (data.paymentFrequency as
          | "MENSAL"
          | "TRIMESTRAL"
          | "SEMESTRAL"
          | "ANUAL"
          | "PONTUAL") || "ANUAL",
      policyNumber: data.policyNumber || null,
      insuredValue: data.insuredValue || null,
      coverageType: data.coverageType || null,
      notes: data.notes || null,
      documentUrl: data.documentUrl || null,
    },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

export const updateContract = withAdmin(async (ctx, contractId: string, input: ContractInput) => {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const contract = await db.contract.findFirst({
    where: { id: contractId, condominiumId: ctx.condominiumId },
  });

  if (!contract) return { error: "Contrato não encontrado" };

  const data = parsed.data;

  await db.contract.update({
    where: { id: contractId },
    data: {
      description: data.description,
      type: data.type,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      renewalType: (data.renewalType as "AUTOMATICA" | "MANUAL") || "MANUAL",
      annualCost: data.annualCost,
      paymentFrequency:
        (data.paymentFrequency as
          | "MENSAL"
          | "TRIMESTRAL"
          | "SEMESTRAL"
          | "ANUAL"
          | "PONTUAL") || "ANUAL",
      policyNumber: data.policyNumber || null,
      insuredValue: data.insuredValue || null,
      coverageType: data.coverageType || null,
      notes: data.notes || null,
      documentUrl: data.documentUrl || null,
    },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

export const updateContractStatus = withAdmin(async (ctx, contractId: string, status: string) => {
  const contract = await db.contract.findFirst({
    where: { id: contractId, condominiumId: ctx.condominiumId },
  });

  if (!contract) return { error: "Contrato não encontrado" };

  await db.contract.update({
    where: { id: contractId },
    data: {
      status: status as "ATIVO" | "EXPIRADO" | "RENOVADO" | "CANCELADO",
    },
  });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});

export const deleteContract = withAdmin(async (ctx, contractId: string) => {
  const contract = await db.contract.findFirst({
    where: { id: contractId, condominiumId: ctx.condominiumId },
  });

  if (!contract) return { error: "Contrato não encontrado" };

  await db.contract.delete({ where: { id: contractId } });

  revalidatePath(`/c/${ctx.slug}`);
  return { success: true };
});
