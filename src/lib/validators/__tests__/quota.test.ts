import { describe, it, expect } from "vitest";
import {
  quotaConfigSchema,
  quotaGenerateSchema,
  quotaPaymentSchema,
} from "../quota";

describe("quotaConfigSchema", () => {
  it("accepts valid config", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 500,
      splitMethod: "PERMILAGEM",
      dueDay: 8,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero amount", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 0,
      splitMethod: "EQUAL",
      dueDay: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: -100,
      splitMethod: "EQUAL",
      dueDay: 1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects due day 0", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 500,
      splitMethod: "PERMILAGEM",
      dueDay: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects due day above 28", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 500,
      splitMethod: "PERMILAGEM",
      dueDay: 29,
    });
    expect(result.success).toBe(false);
  });

  it("accepts due day 28 (boundary)", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 500,
      splitMethod: "EQUAL",
      dueDay: 28,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid split method", () => {
    const result = quotaConfigSchema.safeParse({
      totalMonthlyAmount: 500,
      splitMethod: "INVALID",
      dueDay: 8,
    });
    expect(result.success).toBe(false);
  });
});

describe("quotaGenerateSchema", () => {
  const valid = {
    startMonth: "2026-01",
    endMonth: "2026-12",
    totalMonthlyAmount: 500,
    splitMethod: "PERMILAGEM" as const,
    dueDay: 8,
  };

  it("accepts valid generation input", () => {
    const result = quotaGenerateSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts single-month range", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      startMonth: "2026-06",
      endMonth: "2026-06",
    });
    expect(result.success).toBe(true);
  });

  it("rejects start after end", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      startMonth: "2026-12",
      endMonth: "2026-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // The refinement error should be on endMonth
      const endMonthError = result.error.issues.find(
        (i) => i.path.includes("endMonth")
      );
      expect(endMonthError).toBeDefined();
    }
  });

  it("accepts cross-year range", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      startMonth: "2026-10",
      endMonth: "2027-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty start month", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      startMonth: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional unit overrides", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      unitOverrides: [
        { unitId: "unit-1", amount: 100 },
        { unitId: "unit-2", amount: 200 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects unit override with zero amount", () => {
    const result = quotaGenerateSchema.safeParse({
      ...valid,
      unitOverrides: [{ unitId: "unit-1", amount: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

describe("quotaPaymentSchema", () => {
  it("accepts valid payment", () => {
    const result = quotaPaymentSchema.safeParse({
      paymentDate: "2026-03-15",
      paymentMethod: "TRANSFERENCIA",
      paymentNotes: "Ref MB 123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts payment without notes", () => {
    const result = quotaPaymentSchema.safeParse({
      paymentDate: "2026-03-15",
      paymentMethod: "MBWAY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty payment date", () => {
    const result = quotaPaymentSchema.safeParse({
      paymentDate: "",
      paymentMethod: "NUMERARIO",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = quotaPaymentSchema.safeParse({
      paymentDate: "2026-03-15",
      paymentMethod: "PAYPAL",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid payment methods", () => {
    const methods = [
      "TRANSFERENCIA",
      "NUMERARIO",
      "CHEQUE",
      "MBWAY",
      "MULTIBANCO",
      "OUTRO",
    ];
    for (const method of methods) {
      const result = quotaPaymentSchema.safeParse({
        paymentDate: "2026-01-01",
        paymentMethod: method,
      });
      expect(result.success).toBe(true);
    }
  });
});
