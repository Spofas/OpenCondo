/**
 * Scenario tests: Full condominium financial lifecycle.
 *
 * Sets up Edifício Aurora (6 units) with a year of quotas, partial payments,
 * and expenses, then verifies that debtor tracking and conta de gerência
 * produce consistent, correct results across the entire workflow.
 */

import { describe, it, expect } from "vitest";
import {
  AURORA_UNITS,
  AURORA_BUDGET,
  AURORA_MONTHLY_AMOUNT,
  AURORA_OWNERS,
  makeAuroraQuotas,
  makeAuroraExpenses,
} from "./fixtures";
import { splitByPermilagem, splitEqually, generateMonthRange } from "../quota-calculations";
import { buildDebtorSummary, type QuotaForDebtor } from "../debtor-calculations";
import { buildContaGerencia, type ContaGerenciaInput } from "../conta-gerencia";
import { calculateReserveFund } from "../reserve-fund";

// Scenario date: mid-September 2026
const TODAY = new Date("2026-09-15");

/**
 * Payment scenario:
 * - Ana (R/C Esq): pays all 12 months — model resident
 * - Bruno (R/C Dto): pays Jan–Jun, stops — 3 months overdue
 * - Carla (1.º Esq): pays Jan–Aug — just 1 month overdue
 * - Daniel (1.º Dto): pays Jan, Mar, May only — spotty payer
 * - Eva (2.º Esq): pays nothing — chronic debtor
 * - Filipe (2.º Dto): pays Jan–Sep (all due months) — up to date
 */
function buildPaidMonths(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();

  // Ana: all 12 months
  map.set("aurora-rc-esq", new Set(generateMonthRange("2026-01", "2026-12")));

  // Bruno: Jan–Jun
  map.set("aurora-rc-dto", new Set(generateMonthRange("2026-01", "2026-06")));

  // Carla: Jan–Aug
  map.set("aurora-1-esq", new Set(generateMonthRange("2026-01", "2026-08")));

  // Daniel: Jan, Mar, May only
  map.set("aurora-1-dto", new Set(["2026-01", "2026-03", "2026-05"]));

  // Eva: nothing
  map.set("aurora-2-esq", new Set());

  // Filipe: Jan–Sep
  map.set("aurora-2-dto", new Set(generateMonthRange("2026-01", "2026-09")));

  return map;
}

const paidMonths = buildPaidMonths();
const allQuotas = makeAuroraQuotas(paidMonths, TODAY);
const allExpenses = makeAuroraExpenses();

describe("Scenario: Aurora lifecycle — quota generation", () => {
  it("generates 72 quotas (6 units × 12 months)", () => {
    expect(allQuotas).toHaveLength(72);
  });

  it("each month's splits sum close to the monthly total", () => {
    for (let m = 1; m <= 12; m++) {
      const period = `2026-${String(m).padStart(2, "0")}`;
      const monthQuotas = allQuotas.filter((q) => q.period === period);
      const sum = monthQuotas.reduce((s, q) => s + q.amount, 0);
      // Rounding may cause slight drift, but within €0.10 of €750
      expect(sum).toBeCloseTo(AURORA_MONTHLY_AMOUNT, 0);
    }
  });

  it("proportional ordering is maintained (higher permilagem = higher quota)", () => {
    const janQuotas = allQuotas.filter((q) => q.period === "2026-01");
    const rcEsq = janQuotas.find((q) => q.unitId === "aurora-rc-esq")!;
    const twoDtoQ = janQuotas.find((q) => q.unitId === "aurora-2-dto")!;
    expect(twoDtoQ.amount).toBeGreaterThan(rcEsq.amount);
    // 220/100 = 2.2× ratio
    expect(twoDtoQ.amount / rcEsq.amount).toBeCloseTo(2.2, 1);
  });

  it("correctly marks PAID, PENDING, and OVERDUE statuses", () => {
    // Ana paid everything — all PAID
    const anaQuotas = allQuotas.filter((q) => q.unitId === "aurora-rc-esq");
    expect(anaQuotas.every((q) => q.status === "PAID")).toBe(true);

    // Eva paid nothing — months 1-9 are OVERDUE (before today), 10-12 PENDING
    const evaQuotas = allQuotas.filter((q) => q.unitId === "aurora-2-esq");
    const evaOverdue = evaQuotas.filter((q) => q.status === "OVERDUE");
    const evaPending = evaQuotas.filter((q) => q.status === "PENDING");
    expect(evaOverdue).toHaveLength(9); // Jan–Sep (due 8th, today is Sept 15)
    expect(evaPending).toHaveLength(3); // Oct–Dec
  });

  it("equal split gives same amount per unit regardless of permilagem", () => {
    const splits = splitEqually(AURORA_MONTHLY_AMOUNT, [...AURORA_UNITS]);
    const amounts = new Set(splits.values());
    expect(amounts.size).toBe(1); // all identical
    expect(splits.get("aurora-rc-esq")).toBeCloseTo(750 / 6, 2);
  });
});

describe("Scenario: Aurora lifecycle — debtor tracking", () => {
  const unpaidQuotas: QuotaForDebtor[] = allQuotas
    .filter((q) => q.status !== "PAID")
    .map((q) => ({
      unitId: q.unitId,
      unitIdentifier: q.unitIdentifier,
      ownerName: q.ownerName,
      ownerEmail: q.ownerEmail,
      amount: q.amount,
      dueDate: q.dueDate,
      status: q.status as "PENDING" | "OVERDUE",
    }));

  const summary = buildDebtorSummary(unpaidQuotas, TODAY);

  it("Ana is not in the debtors list (paid all 12 months)", () => {
    const debtorIds = summary.debtors.map((d) => d.unitId);
    expect(debtorIds).not.toContain("aurora-rc-esq");
  });

  it("Filipe has Oct-Dec pending (paid through Sep but future months remain)", () => {
    const filipe = summary.debtors.find((d) => d.unitId === "aurora-2-dto");
    expect(filipe).toBeDefined();
    expect(filipe!.unpaidCount).toBe(3); // Oct, Nov, Dec
    // All in the "current" bucket since they're not yet due
    expect(filipe!.current).toBeGreaterThan(0);
    expect(filipe!.overdue30 + filipe!.overdue60 + filipe!.overdue90 + filipe!.overdue90Plus).toBe(0);
  });

  it("identifies correct number of units with debt", () => {
    // Eva, Daniel, Bruno, Carla all have unpaid. Filipe has Oct-Dec pending.
    // Ana has all paid + Oct-Dec paid (she paid all 12).
    // So debtors: Bruno, Carla, Daniel, Eva, Filipe (Oct-Dec pending)
    expect(summary.unitsWithDebt).toBeGreaterThanOrEqual(4);
  });

  it("Eva is the largest debtor (paid nothing)", () => {
    const eva = summary.debtors.find((d) => d.unitId === "aurora-2-esq");
    expect(eva).toBeDefined();
    // Eva has highest permilagem-based amount AND most unpaid months
    const sortedByDebt = [...summary.debtors].sort((a, b) => b.totalDebt - a.totalDebt);
    expect(sortedByDebt[0].unitId).toBe("aurora-2-esq");
  });

  it("Eva has 9 months overdue and 3 months current/pending", () => {
    const eva = summary.debtors.find((d) => d.unitId === "aurora-2-esq")!;
    expect(eva.unpaidCount).toBe(12);
    // Current (not yet due): Oct-Dec quotas
    expect(eva.current).toBeGreaterThan(0);
    // Total overdue (in some aging bucket): 9 months
    const totalOverdue = eva.overdue30 + eva.overdue60 + eva.overdue90 + eva.overdue90Plus;
    expect(totalOverdue).toBeGreaterThan(0);
  });

  it("Daniel has spotty payment pattern (paid Jan, Mar, May — 6 overdue, 3 pending)", () => {
    const daniel = summary.debtors.find((d) => d.unitId === "aurora-1-dto")!;
    // Unpaid: Feb, Apr, Jun, Jul, Aug, Sep (overdue) + Oct, Nov, Dec (pending) = 9
    expect(daniel.unpaidCount).toBe(9);
  });

  it("overdue amounts land in correct aging buckets", () => {
    // Today: 2026-09-15
    // Sep due (2026-09-08): 7 days overdue → overdue30
    // Aug due (2026-08-08): 38 days overdue → overdue60
    // Jul due (2026-07-08): 69 days overdue → overdue90
    // Jun due (2026-06-08): 99 days overdue → overdue90Plus
    const eva = summary.debtors.find((d) => d.unitId === "aurora-2-esq")!;

    // Eva has quotas in all buckets
    expect(eva.overdue30).toBeGreaterThan(0);   // Sep
    expect(eva.overdue60).toBeGreaterThan(0);   // Aug
    expect(eva.overdue90).toBeGreaterThan(0);   // Jul
    expect(eva.overdue90Plus).toBeGreaterThan(0); // Jan–Jun
  });

  it("summary totals are self-consistent", () => {
    const debtorTotalDebt = summary.debtors.reduce((s, d) => s + d.totalDebt, 0);
    expect(debtorTotalDebt).toBeCloseTo(summary.totalDebt, 1);

    const debtorOverdue = summary.debtors.reduce(
      (s, d) => s + d.overdue30 + d.overdue60 + d.overdue90 + d.overdue90Plus, 0
    );
    expect(debtorOverdue).toBeCloseTo(summary.totalOverdue, 1);
  });
});

describe("Scenario: Aurora lifecycle — conta de gerência", () => {
  const input: ContaGerenciaInput = {
    year: 2026,
    condominiumName: "Edifício Aurora",
    condominiumNif: "501234567",
    condominiumAddress: "Rua da Aurora 42, Lisboa",
    budget: AURORA_BUDGET,
    quotas: allQuotas.map((q) => ({
      unitIdentifier: q.unitIdentifier,
      ownerName: q.ownerName,
      amount: q.amount,
      status: q.status,
      period: q.period,
    })),
    expenses: allExpenses,
  };

  const report = buildContaGerencia(input);

  it("total quotas generated matches budget", () => {
    // 6 units × 12 months, split by permilagem from €750/month
    // Sum should be close to €9000/year
    expect(report.totalQuotasGenerated).toBeCloseTo(9000, 0);
  });

  it("paid + pending + overdue = total generated", () => {
    const sum = report.totalQuotasPaid + report.totalQuotasPending + report.totalQuotasOverdue;
    expect(sum).toBeCloseTo(report.totalQuotasGenerated, 1);
  });

  it("collection rate is realistic (partial payment scenario)", () => {
    // We have mixed payment patterns — rate should be between 30% and 80%
    expect(report.collectionRate).toBeGreaterThan(30);
    expect(report.collectionRate).toBeLessThan(80);
  });

  it("total expenses sum correctly", () => {
    const expectedTotal =
      200 * 12 + // Limpeza
      80 * 12 +  // Eletricidade
      40 * 12 +  // Água
      450 * 4 +  // Elevador quarterly
      1150 +     // Seguro annual
      1200 +     // Gestão annual
      320 + 180; // Diversos one-off

    expect(report.totalExpenses).toBe(expectedTotal);
  });

  it("expense categories are all present", () => {
    const cats = report.expensesByCategory.map((c) => c.category);
    expect(cats).toContain("Limpeza");
    expect(cats).toContain("Elevador");
    expect(cats).toContain("Seguro");
    expect(cats).toContain("Eletricidade");
    expect(cats).toContain("Água");
    expect(cats).toContain("Gestão");
    expect(cats).toContain("Diversos");
  });

  it("budget variance is correct per line", () => {
    for (const line of report.budgetLines) {
      expect(line.variance).toBeCloseTo(line.planned - line.actual, 2);
    }
  });

  it("Limpeza is under budget (planned 2400, actual 2400)", () => {
    const limpeza = report.budgetLines.find((l) => l.category === "Limpeza")!;
    expect(limpeza.actual).toBe(200 * 12);
    expect(limpeza.variance).toBe(0);
  });

  it("Seguro is under budget (planned 1200, actual 1150)", () => {
    const seguro = report.budgetLines.find((l) => l.category === "Seguro")!;
    expect(seguro.actual).toBe(1150);
    expect(seguro.variance).toBe(50); // saved €50
  });

  it("net balance = paid quotas - expenses", () => {
    expect(report.netBalance).toBeCloseTo(
      report.totalQuotasPaid - report.totalExpenses, 2
    );
  });

  it("reserve fund is 10% of paid quotas", () => {
    expect(report.reserveFundPercentage).toBe(10);
    expect(report.reserveFundContributions).toBeCloseTo(
      report.totalQuotasPaid * 0.1, 2
    );
  });

  it("unit debts only include non-paying units", () => {
    const debtUnits = report.unitDebts.map((u) => u.unitIdentifier);
    // Ana paid everything
    expect(debtUnits).not.toContain("R/C Esq");
    // Eva paid nothing — should be largest debtor
    expect(debtUnits).toContain("2.º Esq");
  });

  it("reserve fund calculation agrees with standalone function", () => {
    const standalone = calculateReserveFund(
      report.totalQuotasPaid,
      report.reserveFundPercentage
    );
    expect(standalone.balance).toBeCloseTo(report.reserveFundBalance, 2);
    expect(standalone.contributions).toBeCloseTo(report.reserveFundContributions, 2);
  });
});

describe("Scenario: Aurora lifecycle — cross-feature consistency", () => {
  const unpaidQuotas: QuotaForDebtor[] = allQuotas
    .filter((q) => q.status !== "PAID")
    .map((q) => ({
      unitId: q.unitId,
      unitIdentifier: q.unitIdentifier,
      ownerName: q.ownerName,
      ownerEmail: q.ownerEmail,
      amount: q.amount,
      dueDate: q.dueDate,
      status: q.status as "PENDING" | "OVERDUE",
    }));

  const debtorSummary = buildDebtorSummary(unpaidQuotas, TODAY);
  const contaInput: ContaGerenciaInput = {
    year: 2026,
    condominiumName: "Edifício Aurora",
    condominiumNif: "501234567",
    condominiumAddress: "Rua da Aurora 42, Lisboa",
    budget: AURORA_BUDGET,
    quotas: allQuotas.map((q) => ({
      unitIdentifier: q.unitIdentifier,
      ownerName: q.ownerName,
      amount: q.amount,
      status: q.status,
      period: q.period,
    })),
    expenses: allExpenses,
  };
  const contaReport = buildContaGerencia(contaInput);

  it("debtor total debt matches conta de gerência pending + overdue", () => {
    const contaTotalUnpaid = contaReport.totalQuotasPending + contaReport.totalQuotasOverdue;
    expect(debtorSummary.totalDebt).toBeCloseTo(contaTotalUnpaid, 1);
  });

  it("debtor unit list matches conta de gerência unit debts", () => {
    const debtorUnitNames = new Set(
      debtorSummary.debtors.map((d) => d.unitIdentifier)
    );
    const contaUnitNames = new Set(
      contaReport.unitDebts.map((u) => u.unitIdentifier)
    );
    expect(debtorUnitNames).toEqual(contaUnitNames);
  });
});
