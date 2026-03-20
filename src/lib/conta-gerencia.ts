/**
 * Conta de Gerência (Annual Management Report) calculations.
 *
 * Portuguese condominium law requires an annual financial report
 * summarizing income (quotas), expenses by category, budget variance,
 * reserve fund status, and outstanding debts per unit.
 */

export interface BudgetLineReport {
  category: string;
  description: string | null;
  planned: number;
  actual: number;
  variance: number; // planned - actual (positive = under budget)
}

export interface UnitDebtReport {
  unitIdentifier: string;
  ownerName: string | null;
  pendingAmount: number;
  overdueAmount: number;
  totalDebt: number;
}

export interface ContaGerenciaReport {
  year: number;
  condominiumName: string;
  condominiumNif: string | null;
  condominiumAddress: string;

  // Income
  totalQuotasGenerated: number;
  totalQuotasPaid: number;
  totalQuotasPending: number;
  totalQuotasOverdue: number;
  collectionRate: number; // percentage 0-100

  // Expenses
  totalExpenses: number;
  expensesByCategory: { category: string; amount: number }[];
  budgetLines: BudgetLineReport[];

  // Budget
  budgetTotal: number;
  budgetStatus: string;
  reserveFundPercentage: number;
  reserveFundContributions: number;
  reserveFundBalance: number;

  // Balance
  netBalance: number; // income - expenses

  // Debts per unit
  unitDebts: UnitDebtReport[];
}

export interface ContaGerenciaInput {
  year: number;
  condominiumName: string;
  condominiumNif: string | null;
  condominiumAddress: string;

  budget: {
    totalAmount: number;
    status: string;
    reserveFundPercentage: number;
    items: { category: string; description: string | null; plannedAmount: number }[];
  } | null;

  quotas: {
    unitIdentifier: string;
    ownerName: string | null;
    amount: number;
    status: "PENDING" | "PAID" | "OVERDUE";
    period: string;
  }[];

  expenses: {
    category: string;
    amount: number;
    date: string;
  }[];
}

export function buildContaGerencia(input: ContaGerenciaInput): ContaGerenciaReport {
  const { year, quotas, expenses, budget } = input;

  // Filter to the year
  const yearQuotas = quotas.filter((q) => q.period.startsWith(`${year}-`));
  const yearExpenses = expenses.filter((e) => e.date.startsWith(`${year}-`));

  // Income
  const totalQuotasGenerated = yearQuotas.reduce((s, q) => s + q.amount, 0);
  const totalQuotasPaid = yearQuotas
    .filter((q) => q.status === "PAID")
    .reduce((s, q) => s + q.amount, 0);
  const totalQuotasPending = yearQuotas
    .filter((q) => q.status === "PENDING")
    .reduce((s, q) => s + q.amount, 0);
  const totalQuotasOverdue = yearQuotas
    .filter((q) => q.status === "OVERDUE")
    .reduce((s, q) => s + q.amount, 0);
  const collectionRate =
    totalQuotasGenerated > 0
      ? round((totalQuotasPaid / totalQuotasGenerated) * 100)
      : 0;

  // Expenses by category
  const catMap = new Map<string, number>();
  for (const e of yearExpenses) {
    catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
  }
  const expensesByCategory = Array.from(catMap.entries())
    .map(([category, amount]) => ({ category, amount: round(amount) }))
    .sort((a, b) => b.amount - a.amount);

  const totalExpenses = round(yearExpenses.reduce((s, e) => s + e.amount, 0));

  // Budget lines with actual spending
  const budgetLines: BudgetLineReport[] = budget
    ? budget.items.map((item) => {
        const actual = catMap.get(item.category) || 0;
        return {
          category: item.category,
          description: item.description,
          planned: item.plannedAmount,
          actual: round(actual),
          variance: round(item.plannedAmount - actual),
        };
      })
    : [];

  // Reserve fund
  const reservePct = budget?.reserveFundPercentage ?? 10;
  const reserveContributions = round(totalQuotasPaid * (reservePct / 100));

  // Debts per unit
  const unitMap = new Map<
    string,
    { ownerName: string | null; pending: number; overdue: number }
  >();
  for (const q of yearQuotas) {
    if (q.status === "PAID") continue;
    const key = q.unitIdentifier;
    const entry = unitMap.get(key) || {
      ownerName: q.ownerName,
      pending: 0,
      overdue: 0,
    };
    if (q.status === "PENDING") entry.pending += q.amount;
    if (q.status === "OVERDUE") entry.overdue += q.amount;
    unitMap.set(key, entry);
  }
  const unitDebts: UnitDebtReport[] = Array.from(unitMap.entries())
    .map(([unitIdentifier, d]) => ({
      unitIdentifier,
      ownerName: d.ownerName,
      pendingAmount: round(d.pending),
      overdueAmount: round(d.overdue),
      totalDebt: round(d.pending + d.overdue),
    }))
    .sort((a, b) => b.totalDebt - a.totalDebt);

  return {
    year,
    condominiumName: input.condominiumName,
    condominiumNif: input.condominiumNif,
    condominiumAddress: input.condominiumAddress,

    totalQuotasGenerated: round(totalQuotasGenerated),
    totalQuotasPaid: round(totalQuotasPaid),
    totalQuotasPending: round(totalQuotasPending),
    totalQuotasOverdue: round(totalQuotasOverdue),
    collectionRate,

    totalExpenses,
    expensesByCategory,
    budgetLines,

    budgetTotal: budget?.totalAmount ?? 0,
    budgetStatus: budget?.status ?? "N/A",
    reserveFundPercentage: reservePct,
    reserveFundContributions: reserveContributions,
    reserveFundBalance: reserveContributions,

    netBalance: round(totalQuotasPaid - totalExpenses),

    unitDebts,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
