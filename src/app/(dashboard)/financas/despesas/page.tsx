import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExpensePageClient } from "./expense-page-client";

export default async function ExpensesPage() {
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
