import { describe, it, expect } from "vitest";
import { budgetSchema, budgetItemSchema } from "../budget";

describe("budgetItemSchema", () => {
  it("accepts a valid item", () => {
    const result = budgetItemSchema.safeParse({
      category: "Limpeza",
      description: "Escadas",
      plannedAmount: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty category", () => {
    const result = budgetItemSchema.safeParse({
      category: "",
      description: "",
      plannedAmount: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = budgetItemSchema.safeParse({
      category: "Seguro",
      description: "",
      plannedAmount: -50,
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = budgetItemSchema.safeParse({
      category: "Seguro",
      description: "",
      plannedAmount: 0,
    });
    expect(result.success).toBe(false);
  });

  it("allows optional id for editing", () => {
    const result = budgetItemSchema.safeParse({
      id: "abc123",
      category: "Elevador",
      description: "",
      plannedAmount: 800,
    });
    expect(result.success).toBe(true);
  });
});

describe("budgetSchema", () => {
  const validBudget = {
    year: 2026,
    reserveFundPercentage: 10,
    items: [{ category: "Limpeza", description: "", plannedAmount: 1200 }],
  };

  it("accepts a valid budget", () => {
    const result = budgetSchema.safeParse(validBudget);
    expect(result.success).toBe(true);
  });

  it("rejects year below 2020", () => {
    const result = budgetSchema.safeParse({ ...validBudget, year: 2019 });
    expect(result.success).toBe(false);
  });

  it("rejects year above 2050", () => {
    const result = budgetSchema.safeParse({ ...validBudget, year: 2051 });
    expect(result.success).toBe(false);
  });

  it("rejects negative reserve fund percentage", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      reserveFundPercentage: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects reserve fund percentage above 100", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      reserveFundPercentage: 101,
    });
    expect(result.success).toBe(false);
  });

  it("allows 0% reserve fund", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      reserveFundPercentage: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty items array", () => {
    const result = budgetSchema.safeParse({ ...validBudget, items: [] });
    expect(result.success).toBe(false);
  });

  it("accepts multiple items", () => {
    const result = budgetSchema.safeParse({
      ...validBudget,
      items: [
        { category: "Limpeza", description: "", plannedAmount: 1200 },
        { category: "Elevador", description: "Manutenção anual", plannedAmount: 800 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
