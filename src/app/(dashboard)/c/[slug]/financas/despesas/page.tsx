import { db } from "@/lib/db";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeExpense, serializeRecurringExpense } from "@/lib/serializers";
import { ExpensePageClient } from "./expense-page-client";

export default async function ExpensesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);

  if (membership.role !== "ADMIN") {
    const { redirect } = await import("next/navigation");
    redirect(`/c/${slug}/painel`);
  }

  const isAdmin = true;

  const expenses = await db.expense.findMany({
    where: { condominiumId: membership.condominiumId },
    orderBy: { date: "desc" },
  });

  const serializedExpenses = expenses.map(serializeExpense);

  const recurringTemplates = isAdmin
    ? (
        await db.recurringExpense.findMany({
          where: { condominiumId: membership.condominiumId },
          orderBy: [{ isActive: "desc" }, { category: "asc" }],
        })
      ).map(serializeRecurringExpense)
    : [];

  return (
    <ExpensePageClient
      expenses={serializedExpenses}
      isAdmin={isAdmin}
      recurringTemplates={recurringTemplates}
    />
  );
}
