import { describe, it, expect } from "vitest";
import { buildContaGerencia, type ContaGerenciaInput } from "../conta-gerencia";

function makeInput(overrides: Partial<ContaGerenciaInput> = {}): ContaGerenciaInput {
  return {
    year: 2025,
    condominiumName: "Condo Teste",
    condominiumNif: "123456789",
    condominiumAddress: "Rua Teste, 1000-000 Lisboa",
    budget: null,
    quotas: [],
    expenses: [],
    ...overrides,
  };
}

describe("buildContaGerencia", () => {
  it("returns zeros when no data", () => {
    const report = buildContaGerencia(makeInput());
    expect(report.year).toBe(2025);
    expect(report.totalQuotasGenerated).toBe(0);
    expect(report.totalExpenses).toBe(0);
    expect(report.netBalance).toBe(0);
    expect(report.collectionRate).toBe(0);
    expect(report.unitDebts).toHaveLength(0);
  });

  it("calculates income totals correctly", () => {
    const report = buildContaGerencia(
      makeInput({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2025-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2025-02" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 50, status: "PENDING", period: "2025-01" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 50, status: "OVERDUE", period: "2025-02" },
        ],
      })
    );

    expect(report.totalQuotasGenerated).toBe(300);
    expect(report.totalQuotasPaid).toBe(200);
    expect(report.totalQuotasPending).toBe(50);
    expect(report.totalQuotasOverdue).toBe(50);
    expect(report.collectionRate).toBeCloseTo(66.67, 1);
  });

  it("filters quotas and expenses by year", () => {
    const report = buildContaGerencia(
      makeInput({
        year: 2025,
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2025-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PAID", period: "2024-12" },
        ],
        expenses: [
          { category: "Limpeza", amount: 50, date: "2025-03-15" },
          { category: "Limpeza", amount: 30, date: "2024-11-10" },
        ],
      })
    );

    expect(report.totalQuotasPaid).toBe(100);
    expect(report.totalExpenses).toBe(50);
  });

  it("groups expenses by category", () => {
    const report = buildContaGerencia(
      makeInput({
        expenses: [
          { category: "Limpeza", amount: 100, date: "2025-01-15" },
          { category: "Limpeza", amount: 50, date: "2025-02-15" },
          { category: "Elevador", amount: 200, date: "2025-03-10" },
        ],
      })
    );

    expect(report.expensesByCategory).toHaveLength(2);
    // Sorted by amount desc
    expect(report.expensesByCategory[0].category).toBe("Elevador");
    expect(report.expensesByCategory[0].amount).toBe(200);
    expect(report.expensesByCategory[1].category).toBe("Limpeza");
    expect(report.expensesByCategory[1].amount).toBe(150);
    expect(report.totalExpenses).toBe(350);
  });

  it("builds budget variance lines", () => {
    const report = buildContaGerencia(
      makeInput({
        budget: {
          totalAmount: 1000,
          status: "APPROVED",
          reserveFundPercentage: 10,
          items: [
            { category: "Limpeza", description: "Limpeza mensal", plannedAmount: 600 },
            { category: "Elevador", description: "Manutenção elevador", plannedAmount: 400 },
          ],
        },
        expenses: [
          { category: "Limpeza", amount: 500, date: "2025-06-01" },
          { category: "Elevador", amount: 450, date: "2025-07-01" },
        ],
      })
    );

    expect(report.budgetLines).toHaveLength(2);
    expect(report.budgetLines[0].variance).toBe(100); // 600 - 500
    expect(report.budgetLines[1].variance).toBe(-50); // 400 - 450
    expect(report.budgetTotal).toBe(1000);
  });

  it("calculates reserve fund contributions", () => {
    const report = buildContaGerencia(
      makeInput({
        budget: {
          totalAmount: 5000,
          status: "APPROVED",
          reserveFundPercentage: 15,
          items: [],
        },
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 2000, status: "PAID", period: "2025-01" },
        ],
      })
    );

    expect(report.reserveFundPercentage).toBe(15);
    expect(report.reserveFundContributions).toBe(300); // 2000 * 15%
  });

  it("computes unit debts sorted by total", () => {
    const report = buildContaGerencia(
      makeInput({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "OVERDUE", period: "2025-01" },
          { unitIdentifier: "A", ownerName: "Ana", amount: 100, status: "PENDING", period: "2025-02" },
          { unitIdentifier: "B", ownerName: "Bruno", amount: 50, status: "OVERDUE", period: "2025-01" },
          { unitIdentifier: "C", ownerName: "Carlos", amount: 80, status: "PAID", period: "2025-01" },
        ],
      })
    );

    expect(report.unitDebts).toHaveLength(2); // C is fully paid, not in debts
    expect(report.unitDebts[0].unitIdentifier).toBe("A");
    expect(report.unitDebts[0].totalDebt).toBe(200);
    expect(report.unitDebts[0].overdueAmount).toBe(100);
    expect(report.unitDebts[0].pendingAmount).toBe(100);
    expect(report.unitDebts[1].unitIdentifier).toBe("B");
    expect(report.unitDebts[1].totalDebt).toBe(50);
  });

  it("calculates net balance", () => {
    const report = buildContaGerencia(
      makeInput({
        quotas: [
          { unitIdentifier: "A", ownerName: "Ana", amount: 500, status: "PAID", period: "2025-01" },
        ],
        expenses: [
          { category: "Limpeza", amount: 300, date: "2025-01-15" },
        ],
      })
    );

    expect(report.netBalance).toBe(200); // 500 - 300
  });

  it("includes unbudgeted expenses in totals and category breakdown", () => {
    // Expenses whose category has no matching budget item must still count
    const report = buildContaGerencia(
      makeInput({
        budget: {
          totalAmount: 1000,
          status: "APPROVED",
          reserveFundPercentage: 10,
          items: [
            { category: "Limpeza", description: null, plannedAmount: 600 },
          ],
        },
        expenses: [
          { category: "Limpeza", amount: 400, date: "2025-03-01" },
          { category: "Obras", amount: 750, date: "2025-04-01" },   // no budget line
          { category: "Diversos", amount: 200, date: "2025-05-01" }, // no budget line
        ],
      })
    );

    // All expenses count toward the total regardless of whether they're budgeted
    expect(report.totalExpenses).toBe(1350);

    // All three categories appear in the breakdown
    expect(report.expensesByCategory).toHaveLength(3);
    const categories = report.expensesByCategory.map((e) => e.category);
    expect(categories).toContain("Obras");
    expect(categories).toContain("Diversos");
    expect(categories).toContain("Limpeza");

    // Budget lines only cover the budgeted category
    expect(report.budgetLines).toHaveLength(1);
    expect(report.budgetLines[0].category).toBe("Limpeza");
    expect(report.budgetLines[0].actual).toBe(400);
    expect(report.budgetLines[0].variance).toBe(200); // 600 - 400

    // Net balance still accounts for all expenses, not just budgeted ones
    expect(report.netBalance).toBe(-1350); // no paid quotas, all expenses
  });

  it("budget lines with zero actual spend show full planned amount as positive variance", () => {
    const report = buildContaGerencia(
      makeInput({
        budget: {
          totalAmount: 2400,
          status: "APPROVED",
          reserveFundPercentage: 10,
          items: [
            { category: "Limpeza", description: null, plannedAmount: 1200 },
            { category: "Elevador", description: null, plannedAmount: 800 },
            { category: "Seguro", description: null, plannedAmount: 400 },
          ],
        },
        expenses: [
          // Only Limpeza has actual spend; Elevador and Seguro have nothing
          { category: "Limpeza", amount: 900, date: "2025-06-01" },
        ],
      })
    );

    expect(report.budgetLines).toHaveLength(3);

    const limpeza = report.budgetLines.find((l) => l.category === "Limpeza")!;
    expect(limpeza.actual).toBe(900);
    expect(limpeza.variance).toBe(300); // underspent

    const elevador = report.budgetLines.find((l) => l.category === "Elevador")!;
    expect(elevador.actual).toBe(0);
    expect(elevador.variance).toBe(800); // full planned amount saved

    const seguro = report.budgetLines.find((l) => l.category === "Seguro")!;
    expect(seguro.actual).toBe(0);
    expect(seguro.variance).toBe(400); // full planned amount saved
  });
});
