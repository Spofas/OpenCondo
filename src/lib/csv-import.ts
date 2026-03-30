/**
 * Parse a CSV string into unit records for bulk import.
 * Expected columns: identifier, floor, typology, permilagem
 * Optional columns: ownerEmail
 *
 * Accepts comma or semicolon as delimiter (common in PT Excel exports).
 */

export interface CsvUnitRow {
  identifier: string;
  floor: number | null;
  typology: string;
  permilagem: number;
  ownerEmail?: string;
}

export interface CsvParseResult {
  units: CsvUnitRow[];
  errors: string[];
}

const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5 MB

export function parseCsvUnits(csv: string): CsvParseResult {
  if (csv.length > MAX_CSV_SIZE) {
    return { units: [], errors: ["Ficheiro CSV demasiado grande (máximo 5 MB)"] };
  }

  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { units: [], errors: ["Ficheiro CSV deve ter um cabeçalho e pelo menos uma linha de dados"] };
  }

  // Detect delimiter
  const delimiter = lines[0].includes(";") ? ";" : ",";

  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  // Map known column names (support Portuguese and English)
  const colMap = {
    identifier: headers.findIndex((h) =>
      ["identifier", "identificador", "fracao", "fração"].includes(h)
    ),
    floor: headers.findIndex((h) => ["floor", "piso", "andar"].includes(h)),
    typology: headers.findIndex((h) =>
      ["typology", "tipologia", "tipo"].includes(h)
    ),
    permilagem: headers.findIndex((h) =>
      ["permilagem", "permil", "mil"].includes(h)
    ),
    ownerEmail: headers.findIndex((h) =>
      ["owneremail", "email", "proprietario", "proprietário"].includes(h)
    ),
  };

  if (colMap.identifier === -1) {
    return {
      units: [],
      errors: [
        "Coluna 'identificador' não encontrada no cabeçalho. Colunas aceites: identificador, fracao, identifier",
      ],
    };
  }

  const units: CsvUnitRow[] = [];
  const errors: string[] = [];
  const seenIdentifiers = new Map<string, number>(); // identifier → first line number

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim().replace(/^['"]|['"]$/g, ""));
    const lineNum = i + 1;

    const identifier = colMap.identifier >= 0 ? cols[colMap.identifier] : "";
    if (!identifier) {
      errors.push(`Linha ${lineNum}: identificador em falta`);
      continue;
    }

    if (seenIdentifiers.has(identifier)) {
      errors.push(
        `Linha ${lineNum}: identificador '${identifier}' duplicado (já aparece na linha ${seenIdentifiers.get(identifier)})`
      );
      continue;
    }
    seenIdentifiers.set(identifier, lineNum);

    const floorRaw = colMap.floor >= 0 ? cols[colMap.floor] || "" : "";
    const floorParsed = floorRaw !== "" ? parseInt(floorRaw, 10) : NaN;
    const floor: number | null = !isNaN(floorParsed) ? floorParsed : null;
    const typology = colMap.typology >= 0 ? cols[colMap.typology] || "" : "";

    let permilagem = 0;
    if (colMap.permilagem >= 0 && cols[colMap.permilagem]) {
      permilagem = parseInt(cols[colMap.permilagem], 10);
      if (isNaN(permilagem) || permilagem < 0) {
        errors.push(`Linha ${lineNum}: permilagem inválida '${cols[colMap.permilagem]}'`);
        continue;
      }
    }

    const ownerEmail =
      colMap.ownerEmail >= 0 ? cols[colMap.ownerEmail] || undefined : undefined;

    units.push({ identifier, floor, typology, permilagem, ownerEmail });
  }

  return { units, errors };
}
