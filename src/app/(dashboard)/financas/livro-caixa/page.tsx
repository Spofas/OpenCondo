import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getUserMembership } from "@/lib/auth/get-membership";
import { db } from "@/lib/db";
import { LivroCaixaPageClient } from "./livro-caixa-page-client";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function LivroCaixaPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await getUserMembership(session.user.id);
  if (!membership) redirect("/iniciar");
  if (membership.role !== "ADMIN") redirect("/painel");

  const { condominiumId } = membership;
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : now;

  // Current balance (sum of ALL transactions)
  const totalAgg = await db.transaction.aggregate({
    where: { condominiumId },
    _sum: { amount: true },
  });
  const currentBalance = Number(totalAgg._sum.amount ?? 0);

  // Opening balance for selected period (sum of everything strictly before `from`)
  const openingAgg = await db.transaction.aggregate({
    where: { condominiumId, date: { lt: from } },
    _sum: { amount: true },
  });
  const openingBalance = Number(openingAgg._sum.amount ?? 0);

  // Transactions within the selected period
  const rawEntries = await db.transaction.findMany({
    where: { condominiumId, date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
  });

  const entries = rawEntries.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    amount: Number(e.amount),
    type: e.type,
    description: e.description,
    quotaId: e.quotaId,
    expenseId: e.expenseId,
  }));

  // Check if opening balance entry exists (to show "set" vs "edit")
  const hasOpeningBalance = await db.transaction.findFirst({
    where: { condominiumId, type: "OPENING_BALANCE" },
    select: { id: true },
  });

  return (
    <LivroCaixaPageClient
      currentBalance={currentBalance}
      openingBalance={openingBalance}
      entries={entries}
      hasOpeningBalance={!!hasOpeningBalance}
      from={from.toISOString().split("T")[0]}
      to={to.toISOString().split("T")[0]}
    />
  );
}
