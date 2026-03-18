import { describe, it, expect } from "vitest";
import { recurringExpenseSchema } from "../recurring-expense";

describe("recurringExpenseSchema", () => {
  it("accepts valid input", () => {
    const result = recurringExpenseSchema.safeParse({
      description: "Limpeza escadas",
      amount: 150,
      category: "Limpeza",
      frequency: "MENSAL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing description", () => {
    const result = recurringExpenseSchema.safeParse({
      description: "",
      amount: 100,
      category: "Limpeza",
      frequency: "MENSAL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = recurringExpenseSchema.safeParse({
      description: "Teste",
      amount: -10,
      category: "Limpeza",
      frequency: "MENSAL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid frequency", () => {
    const result = recurringExpenseSchema.safeParse({
      description: "Teste",
      amount: 100,
      category: "Limpeza",
      frequency: "SEMANAL",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid frequencies", () => {
    for (const freq of ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"]) {
      const result = recurringExpenseSchema.safeParse({
        description: "Teste",
        amount: 100,
        category: "Limpeza",
        frequency: freq,
      });
      expect(result.success).toBe(true);
    }
  });
});
