import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeTransaction } from "@/lib/serializers";
import { db } from "@/lib/db";
import { LivroCaixaPageClient } from "./livro-caixa-page-client";

const ITEMS_PER_PAGE = 50;

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}

export default async function LivroCaixaPage({ searchParams }: PageProps) {
  const { membership } = await requireMembership();
  if (membership.role !== "ADMIN") redirect("/painel");

  const { condominiumId } = membership;
  const params = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(params.to) : now;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Current balance (sum of ALL non-deleted transactions)
  const totalAgg = await db.transaction.aggregate({
    where: { condominiumId, deletedAt: null },
    _sum: { amount: true },
  });
  const currentBalance = Number(totalAgg._sum.amount ?? 0);

  // Opening balance for selected period (sum of everything strictly before `from`)
  const openingAgg = await db.transaction.aggregate({
    where: { condominiumId, date: { lt: from }, deletedAt: null },
    _sum: { amount: true },
  });
  const openingBalance = Number(openingAgg._sum.amount ?? 0);

  const dateFilter = { condominiumId, date: { gte: from, lte: to }, deletedAt: null };

  // Count total entries for pagination
  const totalEntries = await db.transaction.count({ where: dateFilter });
  const totalPages = Math.max(1, Math.ceil(totalEntries / ITEMS_PER_PAGE));

  // Transactions within the selected period (paginated)
  const rawEntries = await db.transaction.findMany({
    where: dateFilter,
    orderBy: { date: "asc" },
    skip: (page - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
  });

  const entries = rawEntries.map(serializeTransaction);

  // For running balance calculation: sum of entries before this page's window
  const priorAgg = page > 1
    ? await db.transaction.aggregate({
        where: dateFilter,
        _sum: { amount: true },
        // Sum of the first (page-1)*ITEMS_PER_PAGE entries by date
        // Prisma doesn't support take on aggregate, so we calculate from opening + page offset
      })
    : null;

  // To compute the running balance offset for this page, we need the sum of entries
  // before the current page's slice. Use a raw approach: sum the first N entries.
  let pageOpeningBalance = openingBalance;
  if (page > 1) {
    const priorEntries = await db.transaction.findMany({
      where: dateFilter,
      orderBy: { date: "asc" },
      take: (page - 1) * ITEMS_PER_PAGE,
      select: { amount: true },
    });
    pageOpeningBalance = openingBalance + priorEntries.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  // Check if opening balance entry exists (to show "set" vs "edit")
  const hasOpeningBalance = await db.transaction.findFirst({
    where: { condominiumId, type: "OPENING_BALANCE", deletedAt: null },
    select: { id: true },
  });

  return (
    <LivroCaixaPageClient
      currentBalance={currentBalance}
      openingBalance={pageOpeningBalance}
      entries={entries}
      hasOpeningBalance={!!hasOpeningBalance}
      from={from.toISOString().split("T")[0]}
      to={to.toISOString().split("T")[0]}
      page={page}
      totalPages={totalPages}
      totalEntries={totalEntries}
    />
  );
}
