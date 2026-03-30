import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { ContactsPageClient } from "./contacts-page-client";

export default async function ContactsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const isAdmin = membership.role === "ADMIN";

  const contacts = await db.supplier.findMany({
    where: {
      condominiumId: membership.condominiumId,
      ...(isAdmin ? {} : { visibility: "ALL" }),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const serializedContacts = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    category: c.category,
    notes: c.notes,
    visibility: c.visibility,
  }));

  return (
    <ContactsPageClient
      contacts={serializedContacts}
      isAdmin={isAdmin}
    />
  );
}
