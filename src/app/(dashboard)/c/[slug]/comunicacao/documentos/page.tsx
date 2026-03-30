import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { DocumentPageClient } from "./document-page-client";

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

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
