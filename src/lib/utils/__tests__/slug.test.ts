import { describe, it, expect, vi } from "vitest";
import { nameToSlug, generateUniqueSlug } from "../slug";

describe("nameToSlug", () => {
  it("converts a basic Portuguese name to a slug", () => {
    expect(nameToSlug("Edifício Aurora")).toBe("edificio-aurora");
  });

  it("transliterates Portuguese accented characters", () => {
    expect(nameToSlug("ãçéôü")).toBe("aceou");
    expect(nameToSlug("ÃÇÉÔÜ")).toBe("aceou");
  });

  it("handles a full set of Portuguese diacritics", () => {
    expect(nameToSlug("àáâã èéê ìíî òóôõ ùúûü ç ñ")).toBe(
      "aaaa-eee-iii-oooo-uuuu-c-n",
    );
  });

  it("removes special characters", () => {
    expect(nameToSlug("Prédio #1 (Bloco A)")).toBe("predio-1-bloco-a");
  });

  it("removes leading and trailing hyphens", () => {
    expect(nameToSlug("---hello---")).toBe("hello");
    expect(nameToSlug("  spaces  ")).toBe("spaces");
  });

  it("collapses multiple spaces and hyphens into a single hyphen", () => {
    expect(nameToSlug("Rua   da    Paz")).toBe("rua-da-paz");
    expect(nameToSlug("A---B---C")).toBe("a-b-c");
  });

  it("truncates long names to 60 characters", () => {
    const longName = "A".repeat(100);
    const slug = nameToSlug(longName);
    expect(slug.length).toBeLessThanOrEqual(60);
  });

  it("does not leave a trailing hyphen after truncation", () => {
    // 58 'a's + " bb" → "aaa...a-bb" which is 61 chars, sliced to 60
    // The slice might cut mid-word but should not leave trailing hyphen
    // since the regex replacement runs before the slice
    const name = "a".repeat(58) + " bb";
    const slug = nameToSlug(name);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("returns empty string for empty input", () => {
    expect(nameToSlug("")).toBe("");
  });

  it("returns empty string for whitespace-only input", () => {
    expect(nameToSlug("   ")).toBe("");
  });

  it("returns empty string for only special characters", () => {
    expect(nameToSlug("@#$%^&*")).toBe("");
  });

  it("lowercases uppercase ASCII letters", () => {
    expect(nameToSlug("CONDOMINIO CENTRAL")).toBe("condominio-central");
  });

  it("keeps numbers in the slug", () => {
    expect(nameToSlug("Bloco 42")).toBe("bloco-42");
  });
});

describe("generateUniqueSlug", () => {
  it("returns the base slug when there is no conflict", async () => {
    const checkExists = vi.fn().mockResolvedValue(false);
    const slug = await generateUniqueSlug("Edifício Aurora", checkExists);
    expect(slug).toBe("edificio-aurora");
    expect(checkExists).toHaveBeenCalledWith("edificio-aurora");
  });

  it("appends a random suffix when the base slug conflicts", async () => {
    // First call (base slug) conflicts, second call (with suffix) does not
    const checkExists = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const slug = await generateUniqueSlug("Edifício Aurora", checkExists);
    expect(slug).toMatch(/^edificio-aurora-[a-z0-9]{4}$/);
    expect(checkExists).toHaveBeenCalledTimes(2);
  });

  it("retries up to 10 times before falling back to timestamp", async () => {
    // All suffix attempts conflict
    const checkExists = vi.fn().mockResolvedValue(true);

    const slug = await generateUniqueSlug("Test", checkExists);
    // 1 base check + 10 suffix checks = 11 calls
    expect(checkExists).toHaveBeenCalledTimes(11);
    // Fallback uses base36-encoded timestamp
    expect(slug).toMatch(/^test-[a-z0-9]+$/);
  });

  it("tries different suffixes on repeated conflicts", async () => {
    // Base conflicts, first suffix conflicts, second suffix is fine
    const checkExists = vi
      .fn()
      .mockResolvedValueOnce(true) // base
      .mockResolvedValueOnce(true) // first suffix
      .mockResolvedValueOnce(false); // second suffix

    const slug = await generateUniqueSlug("Bloco A", checkExists);
    expect(slug).toMatch(/^bloco-a-[a-z0-9]{4}$/);
    expect(checkExists).toHaveBeenCalledTimes(3);
  });
});
