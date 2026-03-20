import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { RecurringExpensePageClient } from "./recurring-expense-page-client";

export default async function RecurringExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");
  if (membership.role !== "ADMIN") redirect("/painel");

  const templates = await db.recurringExpense.findMany({
    where: { condominiumId: membership.condominiumId },
    orderBy: [{ isActive: "desc" }, { category: "asc" }],
  });

  const serialized = templates.map((t) => ({
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    category: t.category,
    frequency: t.frequency,
    isActive: t.isActive,
    lastGenerated: t.lastGenerated,
  }));

  return <RecurringExpensePageClient templates={serialized} />;
}
