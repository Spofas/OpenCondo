import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../auth";

describe("registerSchema", () => {
  const valid = {
    name: "João Silva",
    email: "joao@example.com",
    password: "seguro123",
    confirmPassword: "seguro123",
  };

  it("accepts valid registration", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 characters", () => {
    const result = registerSchema.safeParse({ ...valid, name: "J" });
    expect(result.success).toBe(false);
  });

  it("accepts name with exactly 2 characters", () => {
    const result = registerSchema.safeParse({ ...valid, name: "Jo" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = registerSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = registerSchema.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(false);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts password with exactly 8 characters", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "12345678",
      confirmPassword: "12345678",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...valid,
      password: "seguro123",
      confirmPassword: "diferente456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("confirmPassword");
    }
  });

  it("rejects when confirmPassword is empty", () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  const valid = {
    email: "joao@example.com",
    password: "seguro123",
  };

  it("accepts valid login", () => {
    const result = loginSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ ...valid, email: "bad" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ ...valid, password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts any non-empty password (no min length on login)", () => {
    const result = loginSchema.safeParse({ ...valid, password: "x" });
    expect(result.success).toBe(true);
  });
});
