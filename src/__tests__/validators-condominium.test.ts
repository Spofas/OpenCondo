import { describe, it, expect } from "vitest";
import { condominiumSchema, unitSchema, unitsArraySchema } from "@/lib/validators/condominium";

describe("condominiumSchema", () => {
  const validData = {
    name: "Edifício Aurora",
    address: "Rua das Flores, 123",
    postalCode: "1234-567",
    city: "Lisboa",
    nif: "123456789",
    quotaModel: "PERMILAGEM" as const,
  };

  it("accepts valid condominium data", () => {
    const result = condominiumSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("accepts data with optional fields empty", () => {
    const result = condominiumSchema.safeParse({
      name: "Edifício Aurora",
      address: "Rua das Flores, 123",
      postalCode: "",
      nif: "",
      quotaModel: "EQUAL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = condominiumSchema.safeParse({ ...validData, name: "E" });
    expect(result.success).toBe(false);
  });

  it("rejects address shorter than 5 characters", () => {
    const result = condominiumSchema.safeParse({ ...validData, address: "Rua" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid postal code format", () => {
    const result = condominiumSchema.safeParse({ ...validData, postalCode: "12345" });
    expect(result.success).toBe(false);
  });

  it("accepts valid Portuguese postal code", () => {
    const result = condominiumSchema.safeParse({ ...validData, postalCode: "4000-123" });
    expect(result.success).toBe(true);
  });

  it("rejects NIF that is not 9 digits", () => {
    const result = condominiumSchema.safeParse({ ...validData, nif: "12345" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid quotaModel", () => {
    const result = condominiumSchema.safeParse({ ...validData, quotaModel: "INVALID" });
    expect(result.success).toBe(false);
  });
});

describe("unitSchema", () => {
  it("accepts valid unit data", () => {
    const result = unitSchema.safeParse({
      identifier: "1.º Esq",
      floor: 1,
      typology: "T2",
      permilagem: 150,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty identifier", () => {
    const result = unitSchema.safeParse({ identifier: "", permilagem: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects negative permilagem", () => {
    const result = unitSchema.safeParse({ identifier: "1A", permilagem: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero permilagem", () => {
    const result = unitSchema.safeParse({ identifier: "1A", permilagem: 0 });
    expect(result.success).toBe(true);
  });
});

describe("unitsArraySchema", () => {
  it("rejects empty array", () => {
    const result = unitsArraySchema.safeParse([]);
    expect(result.success).toBe(false);
  });

  it("accepts array with one valid unit", () => {
    const result = unitsArraySchema.safeParse([
      { identifier: "R/C", permilagem: 1000 },
    ]);
    expect(result.success).toBe(true);
  });
});
