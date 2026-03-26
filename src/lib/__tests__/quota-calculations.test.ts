import { describe, it, expect } from "vitest";
import {
  splitByPermilagem,
  splitEqually,
  generateMonthRange,
  statusAfterUndo,
} from "../quota-calculations";

describe("splitByPermilagem", () => {
  it("splits proportionally to permilagem", () => {
    const units = [
      { id: "a", permilagem: 100 },
      { id: "b", permilagem: 200 },
      { id: "c", permilagem: 300 },
    ];
    // Total permilagem = 600, total amount = 600
    const result = splitByPermilagem(600, units);
    expect(result.get("a")).toBe(100); // 600 * 100/600
    expect(result.get("b")).toBe(200); // 600 * 200/600
    expect(result.get("c")).toBe(300); // 600 * 300/600
  });

  it("rounds to 2 decimal places", () => {
    const units = [
      { id: "a", permilagem: 333 },
      { id: "b", permilagem: 333 },
      { id: "c", permilagem: 334 },
    ];
    const result = splitByPermilagem(1000, units);
    // 1000 * 333/1000 = 333.00, 1000 * 334/1000 = 334.00
    expect(result.get("a")).toBe(333);
    expect(result.get("b")).toBe(333);
    expect(result.get("c")).toBe(334);
  });

  it("handles non-trivial rounding", () => {
    // 500 / 3 units with equal permilagem — can't split evenly
    const units = [
      { id: "a", permilagem: 100 },
      { id: "b", permilagem: 100 },
      { id: "c", permilagem: 100 },
    ];
    const result = splitByPermilagem(500, units);
    // 500 * 100/300 = 166.666... → 166.67
    expect(result.get("a")).toBe(166.67);
    expect(result.get("b")).toBe(166.67);
    expect(result.get("c")).toBe(166.67);
  });

  it("returns empty map if total permilagem is 0", () => {
    const units = [
      { id: "a", permilagem: 0 },
      { id: "b", permilagem: 0 },
    ];
    const result = splitByPermilagem(500, units);
    expect(result.size).toBe(0);
  });

  it("handles single unit", () => {
    const units = [{ id: "a", permilagem: 500 }];
    const result = splitByPermilagem(1200, units);
    expect(result.get("a")).toBe(1200);
  });

  it("handles empty units array", () => {
    const result = splitByPermilagem(500, []);
    expect(result.size).toBe(0);
  });

  it("handles real-world Portuguese condo scenario", () => {
    // Typical building: 6 units with varying permilagem totaling 1000
    const units = [
      { id: "rc-esq", permilagem: 120 },
      { id: "rc-dto", permilagem: 130 },
      { id: "1-esq", permilagem: 160 },
      { id: "1-dto", permilagem: 170 },
      { id: "2-esq", permilagem: 200 },
      { id: "2-dto", permilagem: 220 },
    ];
    const totalMonthly = 750; // €750/month
    const result = splitByPermilagem(totalMonthly, units);

    // Verify all amounts are positive
    for (const [, amount] of result) {
      expect(amount).toBeGreaterThan(0);
    }

    // Rounding error must be under €0.06 (6 units × max €0.005 per unit at 2dp)
    const sumOfParts = Array.from(result.values()).reduce((s, v) => s + v, 0);
    expect(Math.abs(sumOfParts - totalMonthly)).toBeLessThan(0.06);

    // Verify proportionality: unit with 220‰ should pay more than unit with 120‰
    expect(result.get("2-dto")!).toBeGreaterThan(result.get("rc-esq")!);
  });
});

describe("splitEqually", () => {
  it("splits evenly among units", () => {
    const units = [
      { id: "a", permilagem: 100 },
      { id: "b", permilagem: 200 },
    ];
    const result = splitEqually(1000, units);
    expect(result.get("a")).toBe(500);
    expect(result.get("b")).toBe(500);
  });

  it("rounds to 2 decimal places", () => {
    const units = [
      { id: "a", permilagem: 100 },
      { id: "b", permilagem: 100 },
      { id: "c", permilagem: 100 },
    ];
    // 500 / 3 = 166.666... → 166.67
    const result = splitEqually(500, units);
    expect(result.get("a")).toBe(166.67);
    expect(result.get("b")).toBe(166.67);
    expect(result.get("c")).toBe(166.67);
  });

  it("ignores permilagem values", () => {
    const units = [
      { id: "a", permilagem: 50 },
      { id: "b", permilagem: 950 },
    ];
    const result = splitEqually(1000, units);
    expect(result.get("a")).toBe(result.get("b"));
  });

  it("returns empty map for empty units", () => {
    const result = splitEqually(500, []);
    expect(result.size).toBe(0);
  });

  it("handles single unit", () => {
    const units = [{ id: "a", permilagem: 500 }];
    const result = splitEqually(1200, units);
    expect(result.get("a")).toBe(1200);
  });
});

describe("generateMonthRange", () => {
  it("generates a full year", () => {
    const months = generateMonthRange("2026-01", "2026-12");
    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2026-01");
    expect(months[11]).toBe("2026-12");
  });

  it("generates a single month", () => {
    const months = generateMonthRange("2026-06", "2026-06");
    expect(months).toEqual(["2026-06"]);
  });

  it("handles cross-year range", () => {
    const months = generateMonthRange("2026-10", "2027-03");
    expect(months).toEqual([
      "2026-10",
      "2026-11",
      "2026-12",
      "2027-01",
      "2027-02",
      "2027-03",
    ]);
  });

  it("returns empty array when start is after end", () => {
    const months = generateMonthRange("2026-12", "2026-01");
    expect(months).toEqual([]);
  });

  it("pads months with leading zero", () => {
    const months = generateMonthRange("2026-01", "2026-09");
    expect(months[0]).toBe("2026-01");
    expect(months[8]).toBe("2026-09");
    // Ensure consistent format
    for (const m of months) {
      expect(m).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("handles multi-year range", () => {
    const months = generateMonthRange("2025-11", "2027-02");
    expect(months).toHaveLength(16); // Nov 2025 through Feb 2027
    expect(months[0]).toBe("2025-11");
    expect(months[months.length - 1]).toBe("2027-02");
  });
});

describe("statusAfterUndo", () => {
  it("returns OVERDUE when due date is in the past", () => {
    const pastDate = new Date("2025-01-15");
    const now = new Date("2026-03-18");
    expect(statusAfterUndo(pastDate, now)).toBe("OVERDUE");
  });

  it("returns PENDING when due date is in the future", () => {
    const futureDate = new Date("2027-01-15");
    const now = new Date("2026-03-18");
    expect(statusAfterUndo(futureDate, now)).toBe("PENDING");
  });

  it("returns OVERDUE when due date is exactly now (past by milliseconds)", () => {
    const now = new Date("2026-03-18T12:00:00Z");
    // Due date is the same day but earlier — technically "past"
    const dueDate = new Date("2026-03-18T11:59:59Z");
    expect(statusAfterUndo(dueDate, now)).toBe("OVERDUE");
  });

  it("returns PENDING when due date is exactly now (same time)", () => {
    const now = new Date("2026-03-18T12:00:00Z");
    const dueDate = new Date("2026-03-18T12:00:00Z");
    // dueDate < now is false when equal, so should be PENDING
    expect(statusAfterUndo(dueDate, now)).toBe("PENDING");
  });
});
