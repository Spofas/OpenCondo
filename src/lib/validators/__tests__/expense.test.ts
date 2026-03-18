import { describe, it, expect } from "vitest";
import { expenseSchema } from "../expense";

describe("expenseSchema", () => {
  const valid = {
    date: "2026-03-15",
    description: "Fatura limpeza escadas",
    amount: 150,
    category: "Limpeza",
  };

  it("accepts a valid expense", () => {
    const result = expenseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts expense with notes", () => {
    const result = expenseSchema.safeParse({
      ...valid,
      notes: "Fatura n.º 12345",
    });
    expect(result.success).toBe(true);
  });

  it("accepts expense without notes", () => {
    const result = expenseSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBeUndefined();
    }
  });

  it("rejects empty date", () => {
    const result = expenseSchema.safeParse({ ...valid, date: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = expenseSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects zero amount", () => {
    const result = expenseSchema.safeParse({ ...valid, amount: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = expenseSchema.safeParse({ ...valid, amount: -50 });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = expenseSchema.safeParse({ ...valid, category: "" });
    expect(result.success).toBe(false);
  });

  it("accepts decimal amounts", () => {
    const result = expenseSchema.safeParse({ ...valid, amount: 99.99 });
    expect(result.success).toBe(true);
  });
});
