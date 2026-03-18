import { describe, it, expect } from "vitest";
import { contractSchema } from "../contract";

describe("contractSchema", () => {
  const valid = {
    description: "Contrato de manutenção do elevador",
    type: "Elevador",
    startDate: "2026-01-01",
    annualCost: 1200,
  };

  it("accepts a valid contract", () => {
    const result = contractSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts with all optional fields", () => {
    const result = contractSchema.safeParse({
      ...valid,
      endDate: "2026-12-31",
      renewalType: "AUTOMATICA",
      paymentFrequency: "TRIMESTRAL",
      notes: "Inclui peças de substituição",
      policyNumber: "APL-123456",
      insuredValue: 500000,
      coverageType: "Multirriscos",
      supplierName: "ElevTech Lda",
      supplierNif: "501234567",
      supplierPhone: "210000000",
      supplierEmail: "info@elevtech.pt",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty description", () => {
    const result = contractSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty type", () => {
    const result = contractSchema.safeParse({ ...valid, type: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty startDate", () => {
    const result = contractSchema.safeParse({ ...valid, startDate: "" });
    expect(result.success).toBe(false);
  });

  it("rejects zero annual cost", () => {
    const result = contractSchema.safeParse({ ...valid, annualCost: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects negative annual cost", () => {
    const result = contractSchema.safeParse({ ...valid, annualCost: -500 });
    expect(result.success).toBe(false);
  });

  it("accepts decimal annual cost", () => {
    const result = contractSchema.safeParse({ ...valid, annualCost: 1199.99 });
    expect(result.success).toBe(true);
  });
});
