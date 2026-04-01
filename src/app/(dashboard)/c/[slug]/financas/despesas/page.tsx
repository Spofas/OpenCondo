import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeExpense, serializeRecurringExpense } from "@/lib/serializers";
import { ExpensePageClient } from "./expense-page-client";

const ITEMS_PER_PAGE = 30;

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  if (membership.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect(`/c/${slug}/painel`);
  }

  const isAdmin = true;
  const searchP = await searchParams;
  const page = Math.max(1, parseInt(searchP.page ?? "1", 10));

  const [expenses, totalExpenses, recurringTemplates] = await Promise.all([
    db.expense.findMany({
      where: { condominiumId: membership.condominiumId },
      orderBy: { date: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    db.expense.count({
      where: { condominiumId: membership.condominiumId },
    }),
    db.recurringExpense.findMany({
      where: { condominiumId: membership.condominiumId },
      orderBy: [{ isActive: "desc" }, { category: "asc" }],
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalExpenses / ITEMS_PER_PAGE));

  return (
    <ExpensePageClient
      expenses={expenses.map(serializeExpense)}
      isAdmin={isAdmin}
      recurringTemplates={recurringTemplates.map(serializeRecurringExpense)}
      page={page}
      totalPages={totalPages}
      totalExpenses={totalExpenses}
    />
  );
}
