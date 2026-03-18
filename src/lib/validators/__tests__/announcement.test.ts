import { describe, it, expect } from "vitest";
import { announcementSchema } from "../announcement";

describe("announcementSchema", () => {
  const valid = {
    title: "Aviso de obras",
    body: "As obras no piso 2 começam na próxima semana.",
    category: "OBRAS",
  };

  it("accepts a valid announcement", () => {
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts with pinned flag", () => {
    const result = announcementSchema.safeParse({ ...valid, pinned: true });
    expect(result.success).toBe(true);
  });

  it("rejects empty title", () => {
    const result = announcementSchema.safeParse({ ...valid, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty body", () => {
    const result = announcementSchema.safeParse({ ...valid, body: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = announcementSchema.safeParse({ ...valid, category: "" });
    expect(result.success).toBe(false);
  });

  it("defaults pinned to undefined when not provided", () => {
    const result = announcementSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pinned).toBeUndefined();
    }
  });
});
