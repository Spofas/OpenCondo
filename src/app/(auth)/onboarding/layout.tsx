import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // If user already has a condominium, skip onboarding
  const membership = await db.membership.findFirst({
    where: { userId: session.user.id, isActive: true },
  });

  if (membership) {
    redirect("/painel");
  }

  return <>{children}</>;
}
