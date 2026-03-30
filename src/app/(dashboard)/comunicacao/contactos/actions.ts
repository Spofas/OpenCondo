"use server";

import { db } from "@/lib/db";
import { contactSchema, type ContactInput } from "@/lib/validators/contact";
import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/auth/admin-context";

export async function createContact(input: ContactInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const data = parsed.data;

  await db.supplier.create({
    data: {
      condominiumId: ctx.condominiumId,
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      category: data.category,
      notes: data.notes || null,
      visibility: data.visibility,
    },
  });

  revalidatePath("/comunicacao/contactos");
  return { success: true };
}

export async function updateContact(contactId: string, input: ContactInput) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supplier = await db.supplier.findFirst({
    where: { id: contactId, condominiumId: ctx.condominiumId },
  });
  if (!supplier) return { error: "Contacto não encontrado" };

  const data = parsed.data;

  await db.supplier.update({
    where: { id: contactId },
    data: {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      category: data.category,
      notes: data.notes || null,
      visibility: data.visibility,
    },
  });

  revalidatePath("/comunicacao/contactos");
  return { success: true };
}

export async function deleteContact(contactId: string) {
  const ctx = await getAdminContext();
  if (!ctx) return { error: "Sem permissão" };

  const supplier = await db.supplier.findFirst({
    where: { id: contactId, condominiumId: ctx.condominiumId },
  });
  if (!supplier) return { error: "Contacto não encontrado" };

  // Check if supplier is linked to contracts or expenses
  const [contractCount, expenseCount] = await Promise.all([
    db.contract.count({ where: { supplierId: contactId } }),
    db.expense.count({ where: { supplierId: contactId, deletedAt: null } }),
  ]);

  if (contractCount > 0 || expenseCount > 0) {
    return {
      error: `Não é possível eliminar: contacto ligado a ${contractCount} contrato${contractCount !== 1 ? "s" : ""} e ${expenseCount} despesa${expenseCount !== 1 ? "s" : ""}`,
    };
  }

  await db.supplier.delete({ where: { id: contactId } });

  revalidatePath("/comunicacao/contactos");
  return { success: true };
}
