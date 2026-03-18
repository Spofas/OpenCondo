import { describe, it, expect } from "vitest";
import { maintenanceSchema, maintenanceUpdateSchema } from "../maintenance";

describe("maintenanceSchema", () => {
  const valid = {
    title: "Elevador avariado",
    description: "O elevador não funciona desde ontem.",
    priority: "ALTA",
  };

  it("accepts a valid request", () => {
    const result = maintenanceSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts with optional location", () => {
    const result = maintenanceSchema.safeParse({
      ...valid,
      location: "Hall de entrada",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = maintenanceSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty description", () => {
    const result = maintenanceSchema.safeParse({ ...valid, description: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty priority", () => {
    const result = maintenanceSchema.safeParse({ ...valid, priority: "" });
    expect(result.success).toBe(false);
  });
});

describe("maintenanceUpdateSchema", () => {
  it("accepts valid status update", () => {
    const result = maintenanceUpdateSchema.safeParse({ status: "EM_CURSO" });
    expect(result.success).toBe(true);
  });

  it("accepts status with note", () => {
    const result = maintenanceUpdateSchema.safeParse({
      status: "CONCLUIDO",
      note: "Reparação concluída pelo técnico.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty status", () => {
    const result = maintenanceUpdateSchema.safeParse({ status: "" });
    expect(result.success).toBe(false);
  });
});
