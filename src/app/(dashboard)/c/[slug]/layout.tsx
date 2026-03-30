import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { CondominiumProvider } from "@/lib/condominium-context";

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { slug } = await params;

  // Look up the condominium by slug
  const condominium = await db.condominium.findUnique({
    where: { slug },
    select: { id: true, name: true },
  });

  if (!condominium) {
    // Invalid slug — redirect to user's default condo
    const firstMembership = await db.membership.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { condominium: { select: { slug: true } } },
      orderBy: { joinedAt: "asc" },
    });
    if (firstMembership) {
      redirect(`/c/${firstMembership.condominium.slug}/painel`);
    }
    redirect("/iniciar");
  }

  // Verify user has membership for this condo
  const membership = await db.membership.findUnique({
    where: {
      userId_condominiumId: {
        userId: session.user.id,
        condominiumId: condominium.id,
      },
    },
  });

  if (!membership) {
    // User has no access to this condo
    const firstMembership = await db.membership.findFirst({
      where: { userId: session.user.id, isActive: true },
      include: { condominium: { select: { slug: true } } },
      orderBy: { joinedAt: "asc" },
    });
    if (firstMembership) {
      redirect(`/c/${firstMembership.condominium.slug}/painel`);
    }
    redirect("/iniciar");
  }

  // Get all memberships for the condo switcher
  const allMemberships = await db.membership.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { condominium: { select: { id: true, name: true, slug: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <CondominiumProvider slug={slug} condominiumId={condominium.id}>
      <div className="min-h-screen bg-muted">
        <Sidebar
          userName={session.user.name}
          userRole={membership.role}
          condominiumName={condominium.name}
          currentSlug={slug}
          memberships={allMemberships.map((m) => ({
            condominiumId: m.condominiumId,
            condominiumName: m.condominium.name,
            slug: m.condominium.slug,
            role: m.role,
          }))}
        />
        <MobileHeader
          condominiumName={condominium.name}
          currentSlug={slug}
          memberships={allMemberships.map((m) => ({
            condominiumId: m.condominiumId,
            condominiumName: m.condominium.name,
            slug: m.condominium.slug,
            role: m.role,
          }))}
        />
        <MobileNav userRole={membership.role} slug={slug} />
        <main className="lg:pl-64">
          <div className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
            {children}
          </div>
        </main>
      </div>
    </CondominiumProvider>
  );
}
