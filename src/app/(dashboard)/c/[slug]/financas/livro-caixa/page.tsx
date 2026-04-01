import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireMembership } from "@/lib/auth/require-membership";
import { serializeTransaction } from "@/lib/serializers";
import { db } from "@/lib/db";
import { LivroCaixaPageClient } from "./livro-caixa-page-client";

const ITEMS_PER_PAGE = 50;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string; page?: string }>;
}

function LivroCaixaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-3 grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="h-3 w-20 rounded bg-muted mb-2" />
          <div className="h-6 w-28 rounded bg-muted" />
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="h-3 w-20 rounded bg-muted mb-2" />
          <div className="h-6 w-28 rounded bg-muted" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-32 rounded-lg bg-muted" />
        <div className="h-9 w-32 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function LivroCaixaContent({
  condominiumId,
  from,
  to,
  page,
}: {
  condominiumId: string;
  from: Date;
  to: Date;
  page: number;
}) {
  // Current balance (sum of ALL non-deleted transactions)
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

  const dateFilter = { condominiumId, date: { gte: from, lte: to } };

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
    where: { condominiumId, type: "OPENING_BALANCE" },
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

export default async function LivroCaixaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { membership } = await requireMembership(slug);
  if (membership.role !== "ADMIN") redirect(`/c/${slug}/painel`);

  const { condominiumId } = membership;
  const searchP = await searchParams;

  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1); // Jan 1 of current year
  const from = searchP.from ? new Date(searchP.from) : defaultFrom;
  const to = searchP.to ? new Date(searchP.to) : now;
  const page = Math.max(1, parseInt(searchP.page ?? "1", 10));

  return (
    <Suspense fallback={<LivroCaixaSkeleton />}>
      <LivroCaixaContent
        condominiumId={condominiumId}
        from={from}
        to={to}
        page={page}
      />
    </Suspense>
  );
}
