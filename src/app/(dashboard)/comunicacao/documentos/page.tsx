import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { DocumentPageClient } from "./document-page-client";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const isAdmin = membership.role === "ADMIN";

  const documents = await db.document.findMany({
    where: {
      condominiumId: membership.condominiumId,
      ...(isAdmin ? {} : { visibility: "ALL" }),
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedDocuments = documents.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    fileUrl: d.fileUrl,
    fileName: d.fileName,
    fileSize: d.fileSize,
    visibility: d.visibility,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <DocumentPageClient
      documents={serializedDocuments}
      isAdmin={isAdmin}
    />
  );
}
