import { describe, it, expect } from "vitest";
import { openingBalanceSchema, adjustmentSchema } from "../ledger";

describe("openingBalanceSchema", () => {
  it("accepts valid opening balance", () => {
    const result = openingBalanceSchema.safeParse({
      amount: 5000,
      date: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("accepts zero amount", () => {
    const result = openingBalanceSchema.safeParse({
      amount: 0,
      date: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = openingBalanceSchema.safeParse({
      amount: -100,
      date: "2026-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing date", () => {
    const result = openingBalanceSchema.safeParse({ amount: 100, date: "" });
    expect(result.success).toBe(false);
  });

  it("accepts optional description", () => {
    const result = openingBalanceSchema.safeParse({
      amount: 1000,
      date: "2026-01-01",
      description: "Saldo do banco em Jan 2026",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Saldo do banco em Jan 2026");
    }
  });
});

describe("adjustmentSchema", () => {
  it("accepts positive adjustment", () => {
    const result = adjustmentSchema.safeParse({
      amount: 150,
      date: "2026-02-10",
      description: "Receita extra",
    });
    expect(result.success).toBe(true);
  });

  it("accepts negative adjustment", () => {
    const result = adjustmentSchema.safeParse({
      amount: -75,
      date: "2026-02-10",
      description: "Correção de saldo",
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = adjustmentSchema.safeParse({
      amount: 0,
      date: "2026-02-10",
      description: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing description", () => {
    const result = adjustmentSchema.safeParse({
      amount: 100,
      date: "2026-02-10",
      description: "",
    });
    expect(result.success).toBe(false);
  });
});
