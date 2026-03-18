import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { BudgetPageClient } from "./budget-page-client";

export default async function BudgetPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cookieStore = await cookies();
  const selectedCondoId = cookieStore.get("activeCondominiumId")?.value;

  const membership = selectedCondoId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId: selectedCondoId,
          },
        },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
      });

  if (!membership) redirect("/iniciar");

  const budgets = await db.budget.findMany({
    where: { condominiumId: membership.condominiumId },
    include: { items: { orderBy: { category: "asc" } } },
    orderBy: { year: "desc" },
  });

  const serializedBudgets = budgets.map((b) => ({
    id: b.id,
    year: b.year,
    status: b.status as "DRAFT" | "APPROVED",
    totalAmount: Number(b.totalAmount),
    reserveFundPercentage: Number(b.reserveFundPercentage),
    approvedAt: b.approvedAt?.toISOString() ?? null,
    createdAt: b.createdAt.toISOString(),
    items: b.items.map((item) => ({
      id: item.id,
      category: item.category,
      description: item.description,
      plannedAmount: Number(item.plannedAmount),
    })),
  }));

  return (
    <BudgetPageClient
      budgets={serializedBudgets}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
