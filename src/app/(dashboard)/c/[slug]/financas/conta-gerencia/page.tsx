import { Suspense } from "react";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireMembershipWithCondo } from "@/lib/auth/require-membership";
import { buildContaGerencia, type ContaGerenciaReport } from "@/lib/conta-gerencia";
import { ContaGerenciaClient } from "./conta-gerencia-client";

function ContaGerenciaSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex gap-2">
        <div className="h-9 w-24 rounded-lg bg-muted" />
        <div className="h-9 w-24 rounded-lg bg-muted" />
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-48 rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-36 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="h-5 w-32 rounded bg-muted mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function ContaGerenciaContent({
  condoId,
  condo,
  isAdmin,
  yearParam,
}: {
  condoId: string;
  condo: { name: string; nif: string | null; address: string; postalCode: string | null; city: string | null };
  isAdmin: boolean;
  yearParam?: string;
}) {
  // Get available years from budgets and quotas
  const [budgets, quotaPeriods] = await Promise.all([
    db.budget.findMany({
      where: { condominiumId: condoId },
      select: { year: true },
      orderBy: { year: "desc" },
    }),
    db.quota.findMany({
      where: { condominiumId: condoId },
      select: { period: true },
      distinct: ["period"],
    }),
  ]);

  const yearsFromBudgets = budgets.map((b) => b.year);
  const yearsFromQuotas = quotaPeriods.map((q) => parseInt(q.period.split("-")[0], 10));
  const allYears = [...new Set([...yearsFromBudgets, ...yearsFromQuotas])].sort(
    (a, b) => b - a
  );

  // Use year from URL param if valid, otherwise default to most recent
  const parsedYear = yearParam ? parseInt(yearParam, 10) : NaN;
  const currentYear = allYears.includes(parsedYear) ? parsedYear : (allYears[0] || new Date().getFullYear());

  // Build report for the selected year
  const report = await buildReportForYear(condoId, condo, currentYear);

  return (
    <ContaGerenciaClient
      report={report}
      availableYears={allYears}
      defaultYear={currentYear}
      isAdmin={isAdmin}
      condominiumId={condoId}
    />
  );
}

export default async function ContaGerenciaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { slug } = await params;
  const { year } = await searchParams;
  const { membership } = await requireMembershipWithCondo(slug);

  if (membership.role !== "ADMIN") redirect(`/c/${slug}/painel`);

  const condoId = membership.condominiumId;
  const condo = membership.condominium;
  const isAdmin = membership.role === "ADMIN";

  return (
    <Suspense fallback={<ContaGerenciaSkeleton />}>
      <ContaGerenciaContent
        condoId={condoId}
        condo={condo}
        isAdmin={isAdmin}
        yearParam={year}
      />
    </Suspense>
  );
}

async function buildReportForYear(
  condominiumId: string,
  condo: { name: string; nif: string | null; address: string; postalCode: string | null; city: string | null },
  year: number
): Promise<ContaGerenciaReport> {
  const [budget, quotas, expenses] = await Promise.all([
    db.budget.findUnique({
      where: { condominiumId_year: { condominiumId, year } },
      include: { items: true },
    }),
    db.quota.findMany({
      where: { condominiumId, period: { startsWith: `${year}-` } },
      include: {
        unit: {
          select: {
            identifier: true,
            owner: { select: { name: true } },
          },
        },
      },
    }),
    db.expense.findMany({
      where: {
        condominiumId,
        date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`),
        },
      },
    }),
  ]);

  return buildContaGerencia({
    year,
    condominiumName: condo.name,
    condominiumNif: condo.nif,
    condominiumAddress: [condo.address, condo.postalCode, condo.city].filter(Boolean).join(", "),
    budget: budget
      ? {
          totalAmount: Number(budget.totalAmount),
          status: budget.status,
          reserveFundPercentage: Number(budget.reserveFundPercentage),
          items: budget.items.map((i) => ({
            category: i.category,
            description: i.description,
            plannedAmount: Number(i.plannedAmount),
          })),
        }
      : null,
    quotas: quotas.map((q) => ({
      unitId: q.unitId,
      unitIdentifier: q.unit.identifier,
      ownerName: q.unit.owner?.name ?? null,
      amount: Number(q.amount),
      status: q.status as "PENDING" | "PAID" | "OVERDUE",
      period: q.period,
      dueDate: q.dueDate.toISOString(),
    })),
    expenses: expenses.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
      date: e.date.toISOString().slice(0, 10),
    })),
  });
}
