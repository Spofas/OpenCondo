import { describe, it, expect } from "vitest";
import { contactSchema, CONTACT_CATEGORIES } from "../contact";

describe("contactSchema", () => {
  it("accepts valid contact with all fields", () => {
    const result = contactSchema.safeParse({
      name: "Bombeiros Voluntários",
      phone: "217 123 456",
      email: "geral@bombeiros.pt",
      category: "emergencia",
      notes: "24h",
      visibility: "ALL",
    });
    expect(result.success).toBe(true);
  });

  it("accepts contact with only required fields", () => {
    const result = contactSchema.safeParse({
      name: "EDP",
      category: "servicos",
      visibility: "ALL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = contactSchema.safeParse({
      name: "",
      category: "emergencia",
      visibility: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      category: "",
      visibility: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      email: "not-an-email",
      category: "outros",
      visibility: "ALL",
    });
    expect(result.success).toBe(false);
  });

  it("accepts empty string email (optional)", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      email: "",
      category: "outros",
      visibility: "ALL",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid visibility", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      category: "outros",
      visibility: "PUBLIC",
    });
    expect(result.success).toBe(false);
  });

  it("accepts ADMIN_ONLY visibility", () => {
    const result = contactSchema.safeParse({
      name: "Test",
      category: "outros",
      visibility: "ADMIN_ONLY",
    });
    expect(result.success).toBe(true);
  });
});

describe("CONTACT_CATEGORIES", () => {
  it("has emergencia as first category", () => {
    expect(CONTACT_CATEGORIES[0].value).toBe("emergencia");
  });

  it("each category has value and label", () => {
    for (const cat of CONTACT_CATEGORIES) {
      expect(cat.value).toBeTruthy();
      expect(cat.label).toBeTruthy();
    }
  });

  it("has at least 10 categories", () => {
    expect(CONTACT_CATEGORIES.length).toBeGreaterThanOrEqual(10);
  });
});
