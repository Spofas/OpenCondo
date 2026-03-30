import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Legacy catch-all redirect.
 * Old URLs like /painel, /financas/quotas, etc. are redirected
 * to the new slug-based routes: /c/{slug}/painel, /c/{slug}/financas/quotas.
 */
export default async function LegacyCatchAll({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Find user's first active membership to get the slug
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { condominium: { select: { slug: true } } },
    orderBy: { joinedAt: "asc" },
  });

  if (!membership) redirect("/iniciar");

  const { path } = await params;
  const slug = membership.condominium.slug;
  redirect(`/c/${slug}/${path.join("/")}`);
}
