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

// PLACEHOLDER — Part 2 will be added below
