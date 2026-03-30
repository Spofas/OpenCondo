import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { BudgetPageClient } from "./budget-page-client";

export default async function BudgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

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
