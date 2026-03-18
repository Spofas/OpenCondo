import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check if user has any condominium membership
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { condominium: true },
  });

  // If no membership and not on onboarding page, redirect to onboarding
  // (the onboarding page has its own layout, so this only applies to dashboard routes)
  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar
        userName={session.user.name}
        condominiumName={membership.condominium.name}
      />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
