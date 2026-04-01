import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { ContactsPageClient } from "./contacts-page-client";

const ITEMS_PER_PAGE = 50;

export default async function ContactsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  const isAdmin = membership.role === "ADMIN";
  const searchP = await searchParams;
  const page = Math.max(1, parseInt(searchP.page ?? "1", 10));

  const where = {
    condominiumId: membership.condominiumId,
    ...(isAdmin ? {} : { visibility: "ALL" as const }),
  };

  const [contacts, totalContacts] = await Promise.all([
    db.supplier.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.supplier.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalContacts / ITEMS_PER_PAGE));

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
      page={page}
      totalPages={totalPages}
      totalContacts={totalContacts}
    />
  );
}
