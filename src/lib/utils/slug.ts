const PORTUGUESE_MAP: Record<string, string> = {
  à: "a", á: "a", â: "a", ã: "a",
  è: "e", é: "e", ê: "e",
  ì: "i", í: "i", î: "i",
  ò: "o", ó: "o", ô: "o", õ: "o",
  ù: "u", ú: "u", û: "u", ü: "u",
  ç: "c", ñ: "n",
  À: "a", Á: "a", Â: "a", Ã: "a",
  È: "e", É: "e", Ê: "e",
  Ì: "i", Í: "i", Î: "i",
  Ò: "o", Ó: "o", Ô: "o", Õ: "o",
  Ù: "u", Ú: "u", Û: "u", Ü: "u",
  Ç: "c", Ñ: "n",
};

function transliterate(str: string): string {
  return str.replace(/[^\x00-\x7F]/g, (ch) => PORTUGUESE_MAP[ch] ?? "");
}

/**
 * Generate a URL-safe slug from a condominium name.
 * E.g. "Edifício Vila Nova" → "edificio-vila-nova"
 */
export function nameToSlug(name: string): string {
  return transliterate(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Generate a unique slug by appending a short random suffix if needed.
 * Checks the database for conflicts.
 */
export async function generateUniqueSlug(
  name: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = nameToSlug(name);
  if (!(await checkExists(base))) return base;

  // Append random 4-char suffix
  for (let i = 0; i < 10; i++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const candidate = `${base}-${suffix}`;
    if (!(await checkExists(candidate))) return candidate;
  }

  // Fallback: use timestamp
  return `${base}-${Date.now().toString(36)}`;
}
