import { describe, it, expect } from "vitest";
import { buildDebtorSummary, type QuotaForDebtor } from "../debtor-calculations";

const TODAY = new Date("2025-06-15");

function makeQuota(overrides: Partial<QuotaForDebtor> = {}): QuotaForDebtor {
  return {
    unitId: "u1",
    unitIdentifier: "1.º Esq",
    ownerName: "Ana Silva",
    ownerEmail: "ana@test.com",
    amount: 100,
    dueDate: "2025-06-01",
    status: "OVERDUE",
    ...overrides,
  };
}

describe("buildDebtorSummary", () => {
  it("returns empty summary for no quotas", () => {
    const result = buildDebtorSummary([], TODAY);
    expect(result.totalDebt).toBe(0);
    expect(result.debtors).toHaveLength(0);
  });

  it("classifies current (not yet due) quotas", () => {
    const result = buildDebtorSummary(
      [makeQuota({ dueDate: "2025-07-01", status: "PENDING" })],
      TODAY
    );
    expect(result.debtors[0].current).toBe(100);
    expect(result.debtors[0].overdue30).toBe(0);
  });

  it("classifies 1-30 day overdue quotas", () => {
    // 15 June - 1 June = 14 days overdue
    const result = buildDebtorSummary(
      [makeQuota({ dueDate: "2025-06-01" })],
      TODAY
    );
    expect(result.debtors[0].overdue30).toBe(100);
  });

  it("classifies 31-60 day overdue quotas", () => {
    // 15 June - 1 May = 45 days overdue
    const result = buildDebtorSummary(
      [makeQuota({ dueDate: "2025-05-01" })],
      TODAY
    );
    expect(result.debtors[0].overdue60).toBe(100);
  });

  it("classifies 61-90 day overdue quotas", () => {
    // 15 June - 1 April = 75 days overdue
    const result = buildDebtorSummary(
      [makeQuota({ dueDate: "2025-04-01" })],
      TODAY
    );
    expect(result.debtors[0].overdue90).toBe(100);
  });

  it("classifies 90+ day overdue quotas", () => {
    // 15 June - 1 Jan = 165 days overdue
    const result = buildDebtorSummary(
      [makeQuota({ dueDate: "2025-01-01" })],
      TODAY
    );
    expect(result.debtors[0].overdue90Plus).toBe(100);
  });

  it("groups by unit and sorts by total debt desc", () => {
    const quotas = [
      makeQuota({ unitId: "u1", unitIdentifier: "A", amount: 50, dueDate: "2025-06-01" }),
      makeQuota({ unitId: "u1", unitIdentifier: "A", amount: 50, dueDate: "2025-05-01" }),
      makeQuota({ unitId: "u2", unitIdentifier: "B", amount: 200, dueDate: "2025-06-01" }),
    ];
    const result = buildDebtorSummary(quotas, TODAY);

    expect(result.debtors).toHaveLength(2);
    expect(result.debtors[0].unitIdentifier).toBe("B");
    expect(result.debtors[0].totalDebt).toBe(200);
    expect(result.debtors[1].unitIdentifier).toBe("A");
    expect(result.debtors[1].totalDebt).toBe(100);
    expect(result.debtors[1].unpaidCount).toBe(2);
  });

  it("computes summary totals", () => {
    const quotas = [
      makeQuota({ unitId: "u1", amount: 100, dueDate: "2025-06-01" }), // overdue
      makeQuota({ unitId: "u2", amount: 50, dueDate: "2025-07-01", status: "PENDING" }), // current
    ];
    const result = buildDebtorSummary(quotas, TODAY);

    expect(result.totalDebt).toBe(150);
    expect(result.totalOverdue).toBe(100);
    expect(result.unitsWithDebt).toBe(2);
    expect(result.unitsWithOverdue).toBe(1);
  });

  it("tracks oldest due date per unit", () => {
    const quotas = [
      makeQuota({ unitId: "u1", dueDate: "2025-06-01" }),
      makeQuota({ unitId: "u1", dueDate: "2025-03-01" }),
      makeQuota({ unitId: "u1", dueDate: "2025-05-01" }),
    ];
    const result = buildDebtorSummary(quotas, TODAY);
    expect(result.debtors[0].oldestDueDate).toBe("2025-03-01");
  });
});
