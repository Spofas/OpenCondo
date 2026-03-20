/**
 * Scenario tests: Edge cases and boundary conditions.
 *
 * Tests the exact bucket boundaries in debtor aging,
 * reserve fund with extreme values, and rounding across
 * multiple calculation paths.
 */

import { describe, it, expect } from "vitest";
import { buildDebtorSummary, type QuotaForDebtor } from "../debtor-calculations";
import { splitByPermilagem, splitEqually } from "../quota-calculations";
import { calculateReserveFund } from "../reserve-fund";
import { buildContaGerencia } from "../conta-gerencia";

// ── Debtor aging exact boundaries ──────────────────────────────────────────

describe("Debtor aging: exact bucket boundaries", () => {
  const TODAY = new Date("2026-06-30T00:00:00.000Z");

  function quota(dueDate: string, amount = 100): QuotaForDebtor {
    return {
      unitId: "u1",
      unitIdentifier: "R/C",
      ownerName: "Test",
      ownerEmail: null,
      amount,
      dueDate,
      status: "OVERDUE",
    };
  }

  it("due today (0 days overdue) → current bucket", () => {
    const result = buildDebtorSummary([quota("2026-06-30")], TODAY);
    expect(result.debtors[0].current).toBe(100);
    expect(result.debtors[0].overdue30).toBe(0);
  });

  it("due yesterday (1 day overdue) → overdue30 bucket", () => {
    const result = buildDebtorSummary([quota("2026-06-29")], TODAY);
    expect(result.debtors[0].overdue30).toBe(100);
  });

  it("exactly 30 days overdue → overdue30 bucket", () => {
    const result = buildDebtorSummary([quota("2026-05-31")], TODAY);
    expect(result.debtors[0].overdue30).toBe(100);
  });

  it("exactly 31 days overdue → overdue60 bucket", () => {
    const result = buildDebtorSummary([quota("2026-05-30")], TODAY);
    expect(result.debtors[0].overdue60).toBe(100);
  });

  it("exactly 60 days overdue → overdue60 bucket", () => {
    const result = buildDebtorSummary([quota("2026-05-01")], TODAY);
    expect(result.debtors[0].overdue60).toBe(100);
  });

  it("exactly 61 days overdue → overdue90 bucket", () => {
    const result = buildDebtorSummary([quota("2026-04-30")], TODAY);
    expect(result.debtors[0].overdue90).toBe(100);
  });

  it("exactly 90 days overdue → overdue90 bucket", () => {
    const result = buildDebtorSummary([quota("2026-04-01")], TODAY);
    expect(result.debtors[0].overdue90).toBe(100);
  });

  it("exactly 91 days overdue → overdue90Plus bucket", () => {
    const result = buildDebtorSummary([quota("2026-03-31")], TODAY);
    expect(result.debtors[0].overdue90Plus).toBe(100);
  });

  it("very old debt (365 days) → overdue90Plus bucket", () => {
    const result = buildDebtorSummary([quota("2025-06-30")], TODAY);
    expect(result.debtors[0].overdue90Plus).toBe(100);
  });

  it("future due date → current bucket", () => {
    const result = buildDebtorSummary(
      [{ ...quota("2026-07-15"), status: "PENDING" as const }],
      TODAY
    );
    expect(result.debtors[0].current).toBe(100);
    expect(result.totalOverdue).toBe(0);
  });
});

// ── Reserve fund edge cases ────────────────────────────────────────────────

describe("Reserve fund: edge cases", () => {
  it("zero paid quotas → zero balance", () => {
    const result = calculateReserveFund(0, 10);
    expect(result.balance).toBe(0);
    expect(result.contributions).toBe(0);
  });

  it("zero percentage → zero balance even with payments", () => {
    const result = calculateReserveFund(10000, 0);
    expect(result.balance).toBe(0);
  });

  it("100% reserve → entire paid amount goes to reserve", () => {
    const result = calculateReserveFund(5000, 100);
    expect(result.balance).toBe(5000);
  });

  it("handles large amounts without floating point issues", () => {
    const result = calculateReserveFund(999999.99, 10);
    expect(result.balance).toBe(100000); // rounded to 2 dp
  });

  it("standard 10% on typical condominium annual income", () => {
    const result = calculateReserveFund(9000, 10);
    expect(result.balance).toBe(900);
    expect(result.percentage).toBe(10);
  });
});

// ── Rounding consistency across functions ───────────────────────────────────

describe("Rounding consistency: same data through different paths", () => {
  // 7 units with awkward permilagem (doesn't divide cleanly)
  const units = [
    { id: "a", permilagem: 143 },
    { id: "b", permilagem: 143 },
    { id: "c", permilagem: 143 },
    { id: "d", permilagem: 143 },
    { id: "e", permilagem: 143 },
    { id: "f", permilagem: 143 },
    { id: "g", permilagem: 142 },
  ]; // total: 1000

  it("permilagem split amounts are all 2-decimal-place numbers", () => {
    const splits = splitByPermilagem(1000, units);
    for (const amount of splits.values()) {
      const rounded = Math.round(amount * 100) / 100;
      expect(amount).toBe(rounded);
    }
  });

  it("equal split amounts are all 2-decimal-place numbers", () => {
    const splits = splitEqually(1000, units);
    for (const amount of splits.values()) {
      const rounded = Math.round(amount * 100) / 100;
      expect(amount).toBe(rounded);
    }
  });

  it("rounding drift stays within €1 per split for permilagem", () => {
    const amounts = [500, 750, 999.99, 1234.56, 10000];
    for (const total of amounts) {
      const splits = splitByPermilagem(total, units);
      const sum = Array.from(splits.values()).reduce((s, v) => s + v, 0);
      expect(Math.abs(sum - total)).toBeLessThan(1);
    }
  });

  it("rounding drift stays within €1 per split for equal", () => {
    const amounts = [500, 750, 999.99, 1234.56, 10000];
    for (const total of amounts) {
      const splits = splitEqually(total, units);
      const sum = Array.from(splits.values()).reduce((s, v) => s + v, 0);
      expect(Math.abs(sum - total)).toBeLessThan(1);
    }
  });
});

// ── Conta de gerência with no data ─────────────────────────────────────────

describe("Conta de gerência: empty/minimal data", () => {
  it("handles a year with no quotas and no expenses", () => {
    const report = buildContaGerencia({
      year: 2026,
      condominiumName: "Prédio Vazio",
      condominiumNif: null,
      condominiumAddress: "Rua Sem Nome",
      budget: null,
      quotas: [],
      expenses: [],
    });

    expect(report.totalQuotasGenerated).toBe(0);
    expect(report.totalExpenses).toBe(0);
    expect(report.netBalance).toBe(0);
    expect(report.collectionRate).toBe(0);
    expect(report.unitDebts).toHaveLength(0);
    expect(report.budgetLines).toHaveLength(0);
  });

  it("filters quotas and expenses to the correct year only", () => {
    const report = buildContaGerencia({
      year: 2026,
      condominiumName: "Test",
      condominiumNif: null,
      condominiumAddress: "Test",
      budget: null,
      quotas: [
        { unitIdentifier: "A", ownerName: null, amount: 100, status: "PAID", period: "2025-12" },
        { unitIdentifier: "A", ownerName: null, amount: 100, status: "PAID", period: "2026-01" },
        { unitIdentifier: "A", ownerName: null, amount: 100, status: "PAID", period: "2027-01" },
      ],
      expenses: [
        { category: "Limpeza", amount: 50, date: "2025-12-15" },
        { category: "Limpeza", amount: 50, date: "2026-06-15" },
        { category: "Limpeza", amount: 50, date: "2027-01-15" },
      ],
    });

    // Only 2026 data should be included
    expect(report.totalQuotasGenerated).toBe(100);
    expect(report.totalExpenses).toBe(50);
  });

  it("handles 100% collection rate", () => {
    const report = buildContaGerencia({
      year: 2026,
      condominiumName: "Test",
      condominiumNif: null,
      condominiumAddress: "Test",
      budget: null,
      quotas: [
        { unitIdentifier: "A", ownerName: null, amount: 100, status: "PAID", period: "2026-01" },
        { unitIdentifier: "B", ownerName: null, amount: 200, status: "PAID", period: "2026-01" },
      ],
      expenses: [],
    });

    expect(report.collectionRate).toBe(100);
    expect(report.unitDebts).toHaveLength(0);
  });

  it("handles 0% collection rate (nothing paid)", () => {
    const report = buildContaGerencia({
      year: 2026,
      condominiumName: "Test",
      condominiumNif: null,
      condominiumAddress: "Test",
      budget: null,
      quotas: [
        { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "OVERDUE", period: "2026-01" },
      ],
      expenses: [],
    });

    expect(report.collectionRate).toBe(0);
    expect(report.unitDebts).toHaveLength(1);
    expect(report.netBalance).toBe(0); // no paid quotas, no expenses
  });
});
