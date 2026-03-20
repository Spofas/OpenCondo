/**
 * Scenario tests: Recurring expense frequency logic.
 *
 * Tests the pure frequency-matching logic extracted from the server action.
 * (The server action itself can't be tested without mocking Next.js,
 * but we can test the scheduling rules.)
 */

import { describe, it, expect } from "vitest";
import { FREQUENCY_MONTHS } from "../validators/recurring-expense";

/**
 * Pure function matching the logic in the generateRecurringExpenses action:
 * For a given frequency, should an expense be generated for this month?
 */
function shouldGenerate(frequency: string, month: number): boolean {
  const freqMonths = FREQUENCY_MONTHS[frequency] || 1;
  if (freqMonths === 1) return true; // monthly always generates
  return month % freqMonths === 1;
}

describe("Recurring expense frequency scheduling", () => {
  describe("MENSAL (monthly)", () => {
    it("generates every month", () => {
      for (let m = 1; m <= 12; m++) {
        expect(shouldGenerate("MENSAL", m)).toBe(true);
      }
    });
  });

  describe("TRIMESTRAL (quarterly)", () => {
    it("generates in Jan, Apr, Jul, Oct", () => {
      expect(shouldGenerate("TRIMESTRAL", 1)).toBe(true);
      expect(shouldGenerate("TRIMESTRAL", 4)).toBe(true);
      expect(shouldGenerate("TRIMESTRAL", 7)).toBe(true);
      expect(shouldGenerate("TRIMESTRAL", 10)).toBe(true);
    });

    it("skips other months", () => {
      for (const m of [2, 3, 5, 6, 8, 9, 11, 12]) {
        expect(shouldGenerate("TRIMESTRAL", m)).toBe(false);
      }
    });

    it("generates exactly 4 times per year", () => {
      const count = Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((m) => shouldGenerate("TRIMESTRAL", m)).length;
      expect(count).toBe(4);
    });
  });

  describe("SEMESTRAL (semi-annual)", () => {
    it("generates in Jan and Jul", () => {
      expect(shouldGenerate("SEMESTRAL", 1)).toBe(true);
      expect(shouldGenerate("SEMESTRAL", 7)).toBe(true);
    });

    it("skips other months", () => {
      for (const m of [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]) {
        expect(shouldGenerate("SEMESTRAL", m)).toBe(false);
      }
    });

    it("generates exactly 2 times per year", () => {
      const count = Array.from({ length: 12 }, (_, i) => i + 1)
        .filter((m) => shouldGenerate("SEMESTRAL", m)).length;
      expect(count).toBe(2);
    });
  });

  describe("ANUAL (annual)", () => {
    it("generates only in January", () => {
      expect(shouldGenerate("ANUAL", 1)).toBe(true);
    });

    it("skips all other months", () => {
      for (let m = 2; m <= 12; m++) {
        expect(shouldGenerate("ANUAL", m)).toBe(false);
      }
    });
  });
});

describe("Recurring expense: full year cost simulation", () => {
  interface Template {
    description: string;
    amount: number;
    frequency: string;
  }

  const templates: Template[] = [
    { description: "Limpeza escadas", amount: 200, frequency: "MENSAL" },
    { description: "Manutenção elevador", amount: 450, frequency: "TRIMESTRAL" },
    { description: "Seguro edifício", amount: 1150, frequency: "ANUAL" },
    { description: "Gestão", amount: 600, frequency: "SEMESTRAL" },
  ];

  function yearlyTotal(tmpl: Template): number {
    const freq = FREQUENCY_MONTHS[tmpl.frequency] || 1;
    const timesPerYear = 12 / freq;
    return tmpl.amount * timesPerYear;
  }

  it("monthly: €200 × 12 = €2400/year", () => {
    expect(yearlyTotal(templates[0])).toBe(2400);
  });

  it("quarterly: €450 × 4 = €1800/year", () => {
    expect(yearlyTotal(templates[1])).toBe(1800);
  });

  it("annual: €1150 × 1 = €1150/year", () => {
    expect(yearlyTotal(templates[2])).toBe(1150);
  });

  it("semi-annual: €600 × 2 = €1200/year", () => {
    expect(yearlyTotal(templates[3])).toBe(1200);
  });

  it("total projected annual cost matches expectation", () => {
    const total = templates.reduce((s, t) => s + yearlyTotal(t), 0);
    expect(total).toBe(2400 + 1800 + 1150 + 1200);
    expect(total).toBe(6550);
  });

  it("simulating month-by-month generation matches yearly total", () => {
    let totalGenerated = 0;
    for (let m = 1; m <= 12; m++) {
      for (const tmpl of templates) {
        if (shouldGenerate(tmpl.frequency, m)) {
          totalGenerated += tmpl.amount;
        }
      }
    }
    expect(totalGenerated).toBe(6550);
  });
});
