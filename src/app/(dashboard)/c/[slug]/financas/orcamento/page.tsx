import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { BudgetPageClient } from "./budget-page-client";

export default async function BudgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);
  const condominiumId = membership.condominiumId;

  const budgets = await db.budget.findMany({
    where: { condominiumId },
    include: { items: { orderBy: { category: "asc" } } },
    orderBy: { year: "desc" },
  });

  // Fetch actual expenses grouped by year+category for variance display
  const years = budgets.map((b) => b.year);
  const expenses = years.length > 0
    ? await db.expense.findMany({
        where: {
          condominiumId,
          date: {
            gte: new Date(`${Math.min(...years)}-01-01`),
            lt: new Date(`${Math.max(...years) + 1}-01-01`),
          },
        },
        select: { category: true, amount: true, date: true },
      })
    : [];

  // Build a map: year -> category -> total actual
  const actualMap = new Map<number, Map<string, number>>();
  for (const e of expenses) {
    const y = e.date.getFullYear();
    if (!actualMap.has(y)) actualMap.set(y, new Map());
    const catMap = actualMap.get(y)!;
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + Number(e.amount));
  }

  const serializedBudgets = budgets.map((b) => {
    const yearActuals = actualMap.get(b.year);
    return {
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
        actualAmount: Math.round((yearActuals?.get(item.category) ?? 0) * 100) / 100,
      })),
    };
  });

  return (
    <BudgetPageClient
      budgets={serializedBudgets}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
