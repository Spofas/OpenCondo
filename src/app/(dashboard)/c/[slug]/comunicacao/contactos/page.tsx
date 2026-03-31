import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { ContactsPageClient } from "./contacts-page-client";

export default async function ContactsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

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
