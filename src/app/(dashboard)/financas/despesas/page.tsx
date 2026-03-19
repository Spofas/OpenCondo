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

  return (
    <ExpensePageClient
      expenses={serializedExpenses}
      isAdmin={membership.role === "ADMIN"}
    />
  );
}
