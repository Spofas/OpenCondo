import { describe, it, expect } from "vitest";
import { condominiumSchema, unitSchema, unitsArraySchema } from "../condominium";

describe("condominiumSchema", () => {
  const valid = {
    name: "Edifício Aurora",
    address: "Rua da Liberdade, 42",
    postalCode: "1250-142",
    city: "Lisboa",
    nif: "501234567",
    quotaModel: "PERMILAGEM" as const,
  };

  it("accepts a valid condominium", () => {
    const result = condominiumSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts without optional fields", () => {
    const result = condominiumSchema.safeParse({
      name: "Edifício Sol",
      address: "Rua Nova, 1",
      quotaModel: "EQUAL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = condominiumSchema.safeParse({ ...valid, name: "E" });
    expect(result.success).toBe(false);
  });

  it("rejects address shorter than 5 characters", () => {
    const result = condominiumSchema.safeParse({ ...valid, address: "Rua" });
    expect(result.success).toBe(false);
  });

  // Postal code format: XXXX-XXX
  it("accepts valid Portuguese postal code", () => {
    const result = condominiumSchema.safeParse({ ...valid, postalCode: "4000-123" });
    expect(result.success).toBe(true);
  });

  it("rejects postal code without hyphen", () => {
    const result = condominiumSchema.safeParse({ ...valid, postalCode: "4000123" });
    expect(result.success).toBe(false);
  });

  it("rejects postal code with wrong digit count", () => {
    const result = condominiumSchema.safeParse({ ...valid, postalCode: "400-123" });
    expect(result.success).toBe(false);
  });

  it("rejects postal code with letters", () => {
    const result = condominiumSchema.safeParse({ ...valid, postalCode: "ABCD-EFG" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string as postal code (optional)", () => {
    const result = condominiumSchema.safeParse({ ...valid, postalCode: "" });
    expect(result.success).toBe(true);
  });

  // NIF format: exactly 9 digits
  it("accepts valid 9-digit NIF", () => {
    const result = condominiumSchema.safeParse({ ...valid, nif: "501234567" });
    expect(result.success).toBe(true);
  });

  it("rejects NIF with fewer than 9 digits", () => {
    const result = condominiumSchema.safeParse({ ...valid, nif: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects NIF with more than 9 digits", () => {
    const result = condominiumSchema.safeParse({ ...valid, nif: "1234567890" });
    expect(result.success).toBe(false);
  });

  it("rejects NIF with letters", () => {
    const result = condominiumSchema.safeParse({ ...valid, nif: "50123456A" });
    expect(result.success).toBe(false);
  });

  it("accepts empty string as NIF (optional)", () => {
    const result = condominiumSchema.safeParse({ ...valid, nif: "" });
    expect(result.success).toBe(true);
  });

  // quotaModel enum
  it("accepts PERMILAGEM", () => {
    const result = condominiumSchema.safeParse({ ...valid, quotaModel: "PERMILAGEM" });
    expect(result.success).toBe(true);
  });

  it("accepts EQUAL", () => {
    const result = condominiumSchema.safeParse({ ...valid, quotaModel: "EQUAL" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid quotaModel", () => {
    const result = condominiumSchema.safeParse({ ...valid, quotaModel: "OTHER" });
    expect(result.success).toBe(false);
  });
});

describe("unitSchema", () => {
  const valid = {
    identifier: "1.º Esq",
    floor: 1,
    typology: "T2",
    permilagem: 125,
  };

  it("accepts a valid unit", () => {
    const result = unitSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts without optional fields", () => {
    const result = unitSchema.safeParse({
      identifier: "R/C Dto",
      permilagem: 0,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty identifier", () => {
    const result = unitSchema.safeParse({ ...valid, identifier: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative permilagem", () => {
    const result = unitSchema.safeParse({ ...valid, permilagem: -1 });
    expect(result.success).toBe(false);
  });

  it("accepts zero permilagem", () => {
    const result = unitSchema.safeParse({ ...valid, permilagem: 0 });
    expect(result.success).toBe(true);
  });

  it("rejects non-integer permilagem", () => {
    const result = unitSchema.safeParse({ ...valid, permilagem: 125.5 });
    expect(result.success).toBe(false);
  });
});

describe("unitsArraySchema", () => {
  it("accepts an array with one unit", () => {
    const result = unitsArraySchema.safeParse([
      { identifier: "1.º Esq", permilagem: 500 },
    ]);
    expect(result.success).toBe(true);
  });

  it("accepts multiple units", () => {
    const result = unitsArraySchema.safeParse([
      { identifier: "1.º Esq", permilagem: 250 },
      { identifier: "1.º Dto", permilagem: 250 },
      { identifier: "2.º Esq", permilagem: 250 },
      { identifier: "2.º Dto", permilagem: 250 },
    ]);
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    const result = unitsArraySchema.safeParse([]);
    expect(result.success).toBe(false);
  });
});
