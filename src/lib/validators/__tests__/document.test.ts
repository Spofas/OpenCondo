import { describe, it, expect } from "vitest";
import { documentSchema } from "../document";

describe("documentSchema", () => {
  const valid = {
    name: "Ata da assembleia março 2026",
    category: "ATAS",
    fileUrl: "https://drive.google.com/file/abc123",
    fileName: "ata-marco-2026.pdf",
  };

  it("accepts a valid document", () => {
    const result = documentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("accepts with optional fields", () => {
    const result = documentSchema.safeParse({
      ...valid,
      fileSize: 1024000,
      visibility: "ADMIN_ONLY",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = documentSchema.safeParse({ ...valid, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty category", () => {
    const result = documentSchema.safeParse({ ...valid, category: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty fileUrl", () => {
    const result = documentSchema.safeParse({ ...valid, fileUrl: "" });
    expect(result.success).toBe(false);
  });

  it("rejects empty fileName", () => {
    const result = documentSchema.safeParse({ ...valid, fileName: "" });
    expect(result.success).toBe(false);
  });
});
