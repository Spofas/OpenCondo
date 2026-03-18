import { redirect } from "next/navigation";
import { cookies } from "next/headers";
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

  // Get all active memberships
  const allMemberships = await db.membership.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { condominium: true },
    orderBy: { joinedAt: "asc" },
  });

  // If no membership, redirect to choice screen
  if (allMemberships.length === 0) {
    redirect("/iniciar");
  }

  // Determine which condominium is currently active
  const cookieStore = await cookies();
  const selectedCondoId = cookieStore.get("activeCondominiumId")?.value;

  // Find the selected membership, or fall back to the first one
  const activeMembership =
    allMemberships.find((m) => m.condominiumId === selectedCondoId) ??
    allMemberships[0];

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar
        userName={session.user.name}
        userRole={activeMembership.role}
        condominiumName={activeMembership.condominium.name}
        currentCondominiumId={activeMembership.condominiumId}
        memberships={allMemberships.map((m) => ({
          condominiumId: m.condominiumId,
          condominiumName: m.condominium.name,
          role: m.role,
        }))}
      />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
