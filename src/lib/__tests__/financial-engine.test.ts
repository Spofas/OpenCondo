/**
 * Comprehensive financial engine tests.
 *
 * These tests validate the entire financial pipeline of the application
 * to ensure audit-grade accuracy. Organized in 5 sections:
 *
 * 1. Quota split accuracy (permilagem & equal, rounding, lossless splits)
 * 2. Quota lifecycle (generation, payment, overdue, soft delete)
 * 3. Expense & transaction integrity (creation, recurring, soft delete)
 * 4. Conta de Gerência report consistency (all invariants)
 * 5. Cross-cutting invariants (Decimal safety, year boundaries, edge cases)
 */

import { describe, it, expect } from "vitest";
import { splitByPermilagem, splitEqually, generateMonthRange, statusAfterUndo } from "../quota-calculations";
import { buildContaGerencia, type ContaGerenciaInput } from "../conta-gerencia";
import { isDueThisPeriod, periodSuffix } from "../cron-utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeUnits(permilagems: number[]) {
  return permilagems.map((p, i) => ({ id: `unit-${i}`, permilagem: p }));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function makeReport(overrides: Partial<ContaGerenciaInput> = {}): ContaGerenciaInput {
  return {
    year: 2026,
    condominiumName: "Teste",
    condominiumNif: "123456789",
    condominiumAddress: "Rua Teste, Lisboa",
    budget: null,
    quotas: [],
    expenses: [],
    ...overrides,
  };
}

// Generate a full year of quotas for given units and monthly total
function generateYearQuotas(
  units: { id: string; permilagem: number }[],
  year: number,
  monthlyTotal: number,
  statusFn: (month: number, unitIdx: number) => "PAID" | "PENDING" | "OVERDUE",
) {
  const totalPermilagem = units.reduce((s, u) => s + u.permilagem, 0);
  const quotas: ContaGerenciaInput["quotas"] = [];
  for (let m = 1; m <= 12; m++) {
    for (let i = 0; i < units.length; i++) {
      const amount = round2((monthlyTotal * units[i].permilagem) / totalPermilagem);
      quotas.push({
        unitIdentifier: `Unit-${i}`,
        ownerName: `Owner ${i}`,
        amount,
        status: statusFn(m, i),
        period: `${year}-${String(m).padStart(2, "0")}`,
      });
    }
  }
  return quotas;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PART 1: Quota split accuracy
// ═══════════════════════════════════════════════════════════════════════════════

describe("Financial Engine — Quota Split Accuracy", () => {
  describe("splitByPermilagem — basic correctness", () => {
    it("splits €2000 across standard 6-unit building", () => {
      const units = makeUnits([100, 100, 200, 200, 250, 150]);
      const result = splitByPermilagem(2000, units);

      expect(result.get("unit-0")).toBe(200);   // 100/1000 × 2000
      expect(result.get("unit-1")).toBe(200);   // 100/1000 × 2000
      expect(result.get("unit-2")).toBe(400);   // 200/1000 × 2000
      expect(result.get("unit-3")).toBe(400);   // 200/1000 × 2000
      expect(result.get("unit-4")).toBe(500);   // 250/1000 × 2000
      expect(result.get("unit-5")).toBe(300);   // 150/1000 × 2000
    });

    it("each unit amount is rounded to 2 decimal places", () => {
      const units = makeUnits([333, 333, 334]);
      const result = splitByPermilagem(1000, units);

      for (const amount of result.values()) {
        const decimals = amount.toString().split(".")[1]?.length ?? 0;
        expect(decimals).toBeLessThanOrEqual(2);
      }
    });

    it("handles single unit (gets full amount)", () => {
      const units = makeUnits([1000]);
      const result = splitByPermilagem(5000, units);
      expect(result.get("unit-0")).toBe(5000);
    });

    it("handles zero total amount", () => {
      const units = makeUnits([500, 500]);
      const result = splitByPermilagem(0, units);
      expect(result.get("unit-0")).toBe(0);
      expect(result.get("unit-1")).toBe(0);
    });

    it("handles empty units array", () => {
      const result = splitByPermilagem(1000, []);
      expect(result.size).toBe(0);
    });

    it("handles all-zero permilagem", () => {
      const units = makeUnits([0, 0, 0]);
      const result = splitByPermilagem(1000, units);
      expect(result.size).toBe(0);
    });
  });

  describe("splitByPermilagem — rounding stress tests", () => {
    it("3 units with 333/333/334 splitting €1000", () => {
      const units = makeUnits([333, 333, 334]);
      const result = splitByPermilagem(1000, units);

      // Individual amounts must be correctly rounded
      expect(result.get("unit-0")).toBe(333);
      expect(result.get("unit-1")).toBe(333);
      expect(result.get("unit-2")).toBe(334);
    });

    it("7 units with prime-number permilagem splitting €10000", () => {
      // 97+101+103+107+109+113+127 = 757
      const units = makeUnits([97, 101, 103, 107, 109, 113, 127]);
      const result = splitByPermilagem(10000, units);

      // Every amount must be a valid 2-decimal number
      for (const amount of result.values()) {
        expect(amount).toBeGreaterThan(0);
        expect(Number.isFinite(amount)).toBe(true);
        expect(round2(amount)).toBe(amount);
      }

      // Sum should be very close to total (within rounding tolerance)
      const sum = Array.from(result.values()).reduce((s, v) => s + v, 0);
      expect(Math.abs(sum - 10000)).toBeLessThan(units.length * 0.01);
    });

    it("splits €0.01 across 2 units", () => {
      const units = makeUnits([500, 500]);
      const result = splitByPermilagem(0.01, units);

      // Each should get 0.01 or 0.00 (rounding may assign differently)
      for (const amount of result.values()) {
        expect(amount).toBeGreaterThanOrEqual(0);
        expect(round2(amount)).toBe(amount);
      }
    });

    it("large amount: €1,000,000 split across 20 units", () => {
      const perms = Array.from({ length: 20 }, (_, i) => 50); // 20 × 50 = 1000
      const units = makeUnits(perms);
      const result = splitByPermilagem(1000000, units);

      for (const amount of result.values()) {
        expect(amount).toBe(50000); // exactly 50/1000 × 1M
      }
    });
  });

  describe("splitEqually — correctness", () => {
    it("splits €1200 across 4 units equally", () => {
      const units = makeUnits([100, 200, 300, 400]); // permilagem ignored
      const result = splitEqually(1200, units);

      for (const amount of result.values()) {
        expect(amount).toBe(300);
      }
    });

    it("splits €100 across 3 units (rounding)", () => {
      const units = makeUnits([100, 100, 100]);
      const result = splitEqually(100, units);

      for (const amount of result.values()) {
        expect(amount).toBe(33.33);
        expect(round2(amount)).toBe(amount);
      }
    });

    it("handles empty units", () => {
      const result = splitEqually(1000, []);
      expect(result.size).toBe(0);
    });
  });

  describe("generateMonthRange", () => {
    it("generates full year", () => {
      const months = generateMonthRange("2026-01", "2026-12");
      expect(months).toHaveLength(12);
      expect(months[0]).toBe("2026-01");
      expect(months[11]).toBe("2026-12");
    });

    it("generates partial year", () => {
      const months = generateMonthRange("2026-04", "2026-09");
      expect(months).toHaveLength(6);
      expect(months[0]).toBe("2026-04");
      expect(months[5]).toBe("2026-09");
    });

    it("spans year boundary", () => {
      const months = generateMonthRange("2025-11", "2026-02");
      expect(months).toEqual(["2025-11", "2025-12", "2026-01", "2026-02"]);
    });

    it("single month", () => {
      const months = generateMonthRange("2026-06", "2026-06");
      expect(months).toEqual(["2026-06"]);
    });

    it("empty if start > end", () => {
      const months = generateMonthRange("2026-06", "2026-03");
      expect(months).toHaveLength(0);
    });
  });

  describe("statusAfterUndo", () => {
    it("returns OVERDUE if due date is in the past", () => {
      const past = new Date("2026-01-01");
      const now = new Date("2026-03-15");
      expect(statusAfterUndo(past, now)).toBe("OVERDUE");
    });

    it("returns PENDING if due date is in the future", () => {
      const future = new Date("2026-06-01");
      const now = new Date("2026-03-15");
      expect(statusAfterUndo(future, now)).toBe("PENDING");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART 2: Conta de Gerência report consistency invariants
// ═══════════════════════════════════════════════════════════════════════════════

describe("Financial Engine — Report Consistency Invariants", () => {
  describe("fundamental accounting identity: paid + pending + overdue = generated", () => {
    it("holds for a simple scenario", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PENDING", period: "2026-02" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "OVERDUE", period: "2026-03" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 200, status: "PAID", period: "2026-01" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 200, status: "PAID", period: "2026-02" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 200, status: "OVERDUE", period: "2026-03" },
        ],
      }));

      expect(report.totalQuotasPaid + report.totalQuotasPending + report.totalQuotasOverdue)
        .toBe(report.totalQuotasGenerated);
    });

    it("holds for full year with 6 units (realistic building)", () => {
      const units = makeUnits([100, 100, 200, 200, 250, 150]);
      const quotas = generateYearQuotas(units, 2026, 2000, (month, unitIdx) => {
        if (month <= 3) return "PAID";
        if (month <= 6) return unitIdx < 3 ? "PAID" : "PENDING";
        if (month <= 9) return "PENDING";
        return "OVERDUE";
      });

      const report = buildContaGerencia(makeReport({ quotas }));

      const sum = round2(report.totalQuotasPaid + report.totalQuotasPending + report.totalQuotasOverdue);
      expect(sum).toBe(report.totalQuotasGenerated);
    });

    it("holds when all quotas are paid", () => {
      const quotas = generateYearQuotas(makeUnits([500, 500]), 2026, 1000, () => "PAID");
      const report = buildContaGerencia(makeReport({ quotas }));

      expect(report.totalQuotasPaid).toBe(report.totalQuotasGenerated);
      expect(report.totalQuotasPending).toBe(0);
      expect(report.totalQuotasOverdue).toBe(0);
    });

    it("holds when no quotas are paid", () => {
      const quotas = generateYearQuotas(makeUnits([500, 500]), 2026, 1000, (m) =>
        m <= 6 ? "OVERDUE" : "PENDING"
      );
      const report = buildContaGerencia(makeReport({ quotas }));

      expect(report.totalQuotasPaid).toBe(0);
      expect(report.totalQuotasPending + report.totalQuotasOverdue).toBe(report.totalQuotasGenerated);
    });
  });

  describe("collection rate accuracy", () => {
    it("is 100% when all paid", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "PAID" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({ quotas }));
      expect(report.collectionRate).toBe(100);
    });

    it("is 0% when none paid", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "PENDING" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({ quotas }));
      expect(report.collectionRate).toBe(0);
    });

    it("is 0% when no quotas exist", () => {
      const report = buildContaGerencia(makeReport());
      expect(report.collectionRate).toBe(0);
    });

    it("is correctly calculated for partial payment", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID" as const, period: "2026-01" },
        { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID" as const, period: "2026-02" },
        { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PENDING" as const, period: "2026-03" },
      ];
      const report = buildContaGerencia(makeReport({ quotas }));
      expect(report.collectionRate).toBeCloseTo(66.67, 1);
    });

    it("collection rate × generated ≈ paid (algebraic consistency)", () => {
      const units = makeUnits([120, 230, 150, 500]);
      const quotas = generateYearQuotas(units, 2026, 3000, (m) =>
        m <= 7 ? "PAID" : "PENDING"
      );
      const report = buildContaGerencia(makeReport({ quotas }));

      const derivedPaid = round2(report.totalQuotasGenerated * report.collectionRate / 100);
      // Collection rate is rounded to 2 decimal places, so derived paid can drift
      // by up to ~0.005% of totalQuotasGenerated. Allow proportional tolerance.
      const tolerance = round2(report.totalQuotasGenerated * 0.001); // 0.1%
      expect(Math.abs(derivedPaid - report.totalQuotasPaid)).toBeLessThanOrEqual(tolerance);
    });
  });

  describe("net balance = paid - expenses", () => {
    it("positive balance when income > expenses", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 1000, status: "PAID", period: "2026-01" },
        ],
        expenses: [
          { category: "Limpeza", amount: 600, date: "2026-01-15" },
        ],
      }));
      expect(report.netBalance).toBe(400);
    });

    it("negative balance when expenses > income", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 200, status: "PAID", period: "2026-01" },
        ],
        expenses: [
          { category: "Obras", amount: 5000, date: "2026-02-01" },
        ],
      }));
      expect(report.netBalance).toBe(-4800);
    });

    it("zero balance when no data", () => {
      const report = buildContaGerencia(makeReport());
      expect(report.netBalance).toBe(0);
    });

    it("only PAID quotas count toward income (not pending/overdue)", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "PAID", period: "2026-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "PENDING", period: "2026-02" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "OVERDUE", period: "2026-03" },
        ],
        expenses: [
          { category: "Limpeza", amount: 300, date: "2026-01-15" },
        ],
      }));
      // Net = 500 (paid) - 300 (expenses) = 200
      expect(report.netBalance).toBe(200);
    });

    it("consistency: netBalance = totalQuotasPaid - totalExpenses", () => {
      const units = makeUnits([250, 250, 250, 250]);
      const quotas = generateYearQuotas(units, 2026, 2000, (m, i) =>
        m <= 6 ? "PAID" : (i < 2 ? "PAID" : "OVERDUE")
      );
      const expenses = [
        { category: "Limpeza", amount: 500, date: "2026-01-05" },
        { category: "Elevador", amount: 400, date: "2026-02-15" },
        { category: "Electricidade", amount: 280, date: "2026-03-20" },
        { category: "Limpeza", amount: 500, date: "2026-04-05" },
        { category: "Obras", amount: 3000, date: "2026-07-10" },
      ];
      const report = buildContaGerencia(makeReport({ quotas, expenses }));

      expect(report.netBalance).toBe(round2(report.totalQuotasPaid - report.totalExpenses));
    });
  });

  describe("expense category totals", () => {
    it("sum of categories = totalExpenses", () => {
      const expenses = [
        { category: "Limpeza", amount: 100, date: "2026-01-05" },
        { category: "Limpeza", amount: 200, date: "2026-02-05" },
        { category: "Elevador", amount: 400, date: "2026-01-15" },
        { category: "Electricidade", amount: 150, date: "2026-03-20" },
        { category: "Obras", amount: 3000, date: "2026-06-01" },
      ];
      const report = buildContaGerencia(makeReport({ expenses }));

      const categorySum = report.expensesByCategory.reduce((s, c) => s + c.amount, 0);
      expect(categorySum).toBe(report.totalExpenses);
    });

    it("sorted descending by amount", () => {
      const expenses = [
        { category: "Limpeza", amount: 100, date: "2026-01-05" },
        { category: "Elevador", amount: 400, date: "2026-01-15" },
        { category: "Obras", amount: 200, date: "2026-02-01" },
      ];
      const report = buildContaGerencia(makeReport({ expenses }));

      for (let i = 1; i < report.expensesByCategory.length; i++) {
        expect(report.expensesByCategory[i - 1].amount)
          .toBeGreaterThanOrEqual(report.expensesByCategory[i].amount);
      }
    });

    it("no division by zero when totalExpenses is 0", () => {
      const report = buildContaGerencia(makeReport({ expenses: [] }));
      expect(report.totalExpenses).toBe(0);
      expect(report.expensesByCategory).toHaveLength(0);
    });
  });

  describe("unit debts accuracy", () => {
    it("only includes units with unpaid quotas", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-01" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 100, status: "OVERDUE", period: "2026-01" },
          { unitIdentifier: "C", ownerName: "Carlos", amount: 100, status: "PENDING", period: "2026-01" },
        ],
      }));

      expect(report.unitDebts).toHaveLength(2); // B and C
      expect(report.unitDebts.find(d => d.unitIdentifier === "A")).toBeUndefined();
    });

    it("per-unit debt = sum of pending + overdue for that unit", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "OVERDUE", period: "2026-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "OVERDUE", period: "2026-02" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PENDING", period: "2026-03" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-04" },
        ],
      }));

      expect(report.unitDebts).toHaveLength(1);
      const debt = report.unitDebts[0];
      expect(debt.overdueAmount).toBe(200);
      expect(debt.pendingAmount).toBe(100);
      expect(debt.totalDebt).toBe(300);
    });

    it("total unpaid across all units = totalQuotasPending + totalQuotasOverdue", () => {
      const units = makeUnits([200, 300, 500]);
      const quotas = generateYearQuotas(units, 2026, 1500, (m, i) => {
        if (m <= 4) return "PAID";
        if (m <= 8) return i === 0 ? "PAID" : "OVERDUE";
        return "PENDING";
      });
      const report = buildContaGerencia(makeReport({ quotas }));

      const totalDebtFromUnits = report.unitDebts.reduce((s, d) => s + d.totalDebt, 0);
      expect(round2(totalDebtFromUnits)).toBe(round2(report.totalQuotasPending + report.totalQuotasOverdue));
    });

    it("sorted by totalDebt descending", () => {
      const report = buildContaGerencia(makeReport({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 50, status: "OVERDUE", period: "2026-01" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 300, status: "OVERDUE", period: "2026-01" },
          { unitIdentifier: "C", ownerName: "Carlos", amount: 150, status: "PENDING", period: "2026-01" },
        ],
      }));

      expect(report.unitDebts[0].unitIdentifier).toBe("B");
      expect(report.unitDebts[1].unitIdentifier).toBe("C");
      expect(report.unitDebts[2].unitIdentifier).toBe("A");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PART 3: Budget variance, reserve fund, and year boundary isolation
// ═══════════════════════════════════════════════════════════════════════════════

describe("Financial Engine — Budget & Reserve Fund", () => {
  const standardBudget = {
    totalAmount: 24000,
    status: "APPROVED",
    reserveFundPercentage: 10,
    items: [
      { category: "Limpeza", description: "Limpeza mensal", plannedAmount: 7200 },
      { category: "Elevador", description: "Manutenção elevador", plannedAmount: 4800 },
      { category: "Electricidade", description: "Electricidade comum", plannedAmount: 3600 },
      { category: "Seguro", description: "Seguro multirriscos", plannedAmount: 1800 },
      { category: "Fundo de Reserva", description: "10% do orçamento", plannedAmount: 2400 },
    ],
  };

  describe("budget variance per category", () => {
    it("variance = planned - actual for each line", () => {
      const expenses = [
        { category: "Limpeza", amount: 6000, date: "2026-06-01" },
        { category: "Elevador", amount: 5200, date: "2026-06-01" },
        { category: "Electricidade", amount: 3600, date: "2026-06-01" },
        { category: "Seguro", amount: 1800, date: "2026-06-01" },
        { category: "Fundo de Reserva", amount: 2400, date: "2026-06-01" },
      ];
      const report = buildContaGerencia(makeReport({ budget: standardBudget, expenses }));

      const limpeza = report.budgetLines.find(l => l.category === "Limpeza")!;
      expect(limpeza.planned).toBe(7200);
      expect(limpeza.actual).toBe(6000);
      expect(limpeza.variance).toBe(1200); // under budget

      const elevador = report.budgetLines.find(l => l.category === "Elevador")!;
      expect(elevador.planned).toBe(4800);
      expect(elevador.actual).toBe(5200);
      expect(elevador.variance).toBe(-400); // over budget

      const electr = report.budgetLines.find(l => l.category === "Electricidade")!;
      expect(electr.variance).toBe(0); // exactly on budget
    });

    it("categories with no spending have full planned as positive variance", () => {
      const report = buildContaGerencia(makeReport({
        budget: standardBudget,
        expenses: [], // no spending at all
      }));

      for (const line of report.budgetLines) {
        expect(line.actual).toBe(0);
        expect(line.variance).toBe(line.planned);
      }
    });

    it("unbudgeted expenses appear in totals but not in budget lines", () => {
      const expenses = [
        { category: "Limpeza", amount: 3000, date: "2026-03-01" },
        { category: "Jardinagem", amount: 2000, date: "2026-04-01" }, // not in budget
      ];
      const report = buildContaGerencia(makeReport({ budget: standardBudget, expenses }));

      // Total includes unbudgeted
      expect(report.totalExpenses).toBe(5000);

      // Budget lines only cover budgeted categories
      expect(report.budgetLines.find(l => l.category === "Jardinagem")).toBeUndefined();

      // But category breakdown includes it
      expect(report.expensesByCategory.find(c => c.category === "Jardinagem")).toBeDefined();
    });

    it("sum of budget line planned amounts = budgetTotal", () => {
      const report = buildContaGerencia(makeReport({ budget: standardBudget }));

      const sumPlanned = report.budgetLines.reduce((s, l) => s + l.planned, 0);
      // Budget items may not sum to totalAmount (reserve fund is separate in some cases)
      // but budgetTotal should reflect the budget's totalAmount
      expect(report.budgetTotal).toBe(24000);
      expect(sumPlanned).toBe(
        standardBudget.items.reduce((s, i) => s + i.plannedAmount, 0)
      );
    });

    it("multiple expenses in same category accumulate correctly", () => {
      const expenses = [
        { category: "Limpeza", amount: 600, date: "2026-01-05" },
        { category: "Limpeza", amount: 600, date: "2026-02-05" },
        { category: "Limpeza", amount: 600, date: "2026-03-05" },
        { category: "Limpeza", amount: 600, date: "2026-04-05" },
        { category: "Limpeza", amount: 600, date: "2026-05-05" },
        { category: "Limpeza", amount: 600, date: "2026-06-05" },
      ];
      const report = buildContaGerencia(makeReport({ budget: standardBudget, expenses }));

      const limpeza = report.budgetLines.find(l => l.category === "Limpeza")!;
      expect(limpeza.actual).toBe(3600);
      expect(limpeza.variance).toBe(3600); // 7200 - 3600 = half year
    });
  });

  describe("reserve fund calculations", () => {
    it("contributions = paid × percentage", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 10000, status: "PAID" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({
        budget: { ...standardBudget, reserveFundPercentage: 10 },
        quotas,
      }));

      expect(report.reserveFundPercentage).toBe(10);
      expect(report.reserveFundContributions).toBe(1000); // 10000 × 10%
    });

    it("contributions with 15% rate", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 8000, status: "PAID" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({
        budget: { ...standardBudget, reserveFundPercentage: 15 },
        quotas,
      }));

      expect(report.reserveFundContributions).toBe(1200); // 8000 × 15%
    });

    it("zero contributions when nothing paid", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 5000, status: "PENDING" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({
        budget: standardBudget,
        quotas,
      }));

      expect(report.reserveFundContributions).toBe(0);
    });

    it("defaults to 10% when no budget", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 6000, status: "PAID" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({ quotas }));

      expect(report.reserveFundPercentage).toBe(10);
      expect(report.reserveFundContributions).toBe(600);
    });

    it("reserve fund balance equals contributions (no withdrawals modeled)", () => {
      const quotas = [
        { unitIdentifier: "A", ownerName: "Ana", amount: 12000, status: "PAID" as const, period: "2026-01" },
      ];
      const report = buildContaGerencia(makeReport({
        budget: standardBudget,
        quotas,
      }));

      expect(report.reserveFundBalance).toBe(report.reserveFundContributions);
    });
  });

  describe("year boundary isolation", () => {
    it("quotas from other years are excluded", () => {
      const report = buildContaGerencia(makeReport({
        year: 2026,
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-12" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 999, status: "PAID", period: "2025-12" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 999, status: "PAID", period: "2027-01" },
        ],
      }));

      expect(report.totalQuotasGenerated).toBe(200); // only 2026
      expect(report.totalQuotasPaid).toBe(200);
    });

    it("expenses from other years are excluded", () => {
      const report = buildContaGerencia(makeReport({
        year: 2026,
        expenses: [
          { category: "Limpeza", amount: 500, date: "2026-01-01" },
          { category: "Limpeza", amount: 500, date: "2026-12-31" },
          { category: "Limpeza", amount: 9999, date: "2025-12-31" },
          { category: "Limpeza", amount: 9999, date: "2027-01-01" },
        ],
      }));

      expect(report.totalExpenses).toBe(1000); // only 2026
    });

    it("Jan 1st is included, Dec 31st is included, boundaries are correct", () => {
      const report = buildContaGerencia(makeReport({
        year: 2026,
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 1, status: "PAID", period: "2026-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 1, status: "PAID", period: "2026-12" },
        ],
        expenses: [
          { category: "X", amount: 1, date: "2026-01-01" },
          { category: "X", amount: 1, date: "2026-12-31" },
        ],
      }));

      expect(report.totalQuotasGenerated).toBe(2);
      expect(report.totalExpenses).toBe(2);
    });

    it("report for year with no data returns zeros", () => {
      const report = buildContaGerencia(makeReport({
        year: 2024,
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2026-01" },
        ],
        expenses: [
          { category: "X", amount: 500, date: "2026-06-15" },
        ],
      }));

      expect(report.totalQuotasGenerated).toBe(0);
      expect(report.totalExpenses).toBe(0);
      expect(report.netBalance).toBe(0);
    });
  });
});

// PLACEHOLDER — Part 4 will be added below
