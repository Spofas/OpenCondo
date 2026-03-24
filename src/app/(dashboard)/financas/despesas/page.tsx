import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserMembership } from "@/lib/auth/get-membership";
import { ExpensePageClient } from "./expense-page-client";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");

  const isAdmin = membership.role === "ADMIN";

  const expenses = await db.expense.findMany({
    where: { condominiumId: membership.condominiumId },
    orderBy: { date: "desc" },
  });

  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    description: e.description,
    amount: Number(e.amount),
    category: e.category,
    notes: e.notes,
  }));

  let recurringTemplates: Array<{
    id: string;
    description: string;
    amount: number;
    category: string;
    frequency: string;
    isActive: boolean;
    lastGenerated: string | null;
  }> = [];

  if (isAdmin) {
    const templates = await db.recurringExpense.findMany({
      where: { condominiumId: membership.condominiumId },
      orderBy: [{ isActive: "desc" }, { category: "asc" }],
    });
    recurringTemplates = templates.map((t) => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      category: t.category,
      frequency: t.frequency,
      isActive: t.isActive,
      lastGenerated: t.lastGenerated ?? null,
    }));
  }

  return (
    <ExpensePageClient
      expenses={serializedExpenses}
      isAdmin={isAdmin}
      recurringTemplates={recurringTemplates}
    />
  );
}
