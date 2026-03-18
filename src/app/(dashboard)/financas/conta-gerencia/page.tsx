import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildContaGerencia, type ContaGerenciaReport } from "@/lib/conta-gerencia";
import { ContaGerenciaClient } from "./conta-gerencia-client";

export default async function ContaGerenciaPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cookieStore = await cookies();
  const condominiumId = cookieStore.get("activeCondominiumId")?.value;

  const membership = condominiumId
    ? await db.membership.findUnique({
        where: {
          userId_condominiumId: {
            userId: session.user.id,
            condominiumId,
          },
        },
        include: { condominium: true },
      })
    : await db.membership.findFirst({
        where: { userId: session.user.id, isActive: true },
        include: { condominium: true },
      });

  if (!membership) redirect("/iniciar");

  const condoId = membership.condominiumId;
  const condo = membership.condominium;
  const isAdmin = membership.role === "ADMIN";

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

  // Default to most recent year, or current year
  const currentYear = allYears[0] || new Date().getFullYear();

  // Build report for the default year
  const report = await buildReportForYear(condoId, condo, currentYear);

  return (
    <ContaGerenciaClient
      report={report}
      availableYears={allYears}
      defaultYear={currentYear}
      isAdmin={isAdmin}
    />
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
      unitIdentifier: q.unit.identifier,
      ownerName: q.unit.owner?.name ?? null,
      amount: Number(q.amount),
      status: q.status as "PENDING" | "PAID" | "OVERDUE",
      period: q.period,
    })),
    expenses: expenses.map((e) => ({
      category: e.category,
      amount: Number(e.amount),
      date: e.date.toISOString().slice(0, 10),
    })),
  });
}
