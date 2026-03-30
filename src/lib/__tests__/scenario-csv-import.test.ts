/**
 * Scenario tests: CSV import → quota split round-trip.
 *
 * Verifies that units imported from CSV can feed into quota calculations
 * and that Portuguese-style CSV (semicolons, accented headers) works correctly.
 */

import { describe, it, expect } from "vitest";
import { parseCsvUnits } from "../csv-import";
import { splitByPermilagem } from "../quota-calculations";
import {
  AURORA_CSV_SEMICOLON,
  AURORA_CSV_COMMA,
  AURORA_UNITS,
  AURORA_MONTHLY_AMOUNT,
} from "./fixtures";

describe("Scenario: CSV import with semicolons (Portuguese Excel)", () => {
  const result = parseCsvUnits(AURORA_CSV_SEMICOLON);

  it("parses all 6 units without errors", () => {
    expect(result.errors).toHaveLength(0);
    expect(result.units).toHaveLength(6);
  });

  it("preserves Portuguese identifiers exactly", () => {
    const ids = result.units.map((u) => u.identifier);
    expect(ids).toContain("R/C Esq");
    expect(ids).toContain("1.º Esq");
    expect(ids).toContain("2.º Dto");
  });

  it("parses permilagem as numbers", () => {
    for (const unit of result.units) {
      expect(typeof unit.permilagem).toBe("number");
      expect(unit.permilagem).toBeGreaterThan(0);
    }
  });

  it("total permilagem matches Aurora fixture", () => {
    const total = result.units.reduce((s, u) => s + u.permilagem, 0);
    expect(total).toBe(1000);
  });

  it("owner emails are captured", () => {
    const withEmail = result.units.filter((u) => u.ownerEmail);
    expect(withEmail).toHaveLength(6);
  });
});

describe("Scenario: CSV import with commas (alternative headers)", () => {
  const result = parseCsvUnits(AURORA_CSV_COMMA);

  it("parses all 6 units without errors", () => {
    expect(result.errors).toHaveLength(0);
    expect(result.units).toHaveLength(6);
  });

  it("maps 'fracao' header to identifier", () => {
    expect(result.units[0].identifier).toBe("R/C Esq");
  });

  it("maps 'permil' header to permilagem", () => {
    expect(result.units[0].permilagem).toBe(100);
  });
});

describe("Scenario: CSV → quota split round-trip", () => {
  const csvResult = parseCsvUnits(AURORA_CSV_SEMICOLON);

  it("imported units produce same splits as hardcoded fixtures", () => {
    const csvUnits = csvResult.units.map((u, i) => ({
      id: `csv-${i}`,
      permilagem: u.permilagem,
    }));
    const fixtureUnits = AURORA_UNITS.map((u) => ({
      id: u.id,
      permilagem: u.permilagem,
    }));

    const csvSplits = splitByPermilagem(AURORA_MONTHLY_AMOUNT, csvUnits);
    const fixtureSplits = splitByPermilagem(AURORA_MONTHLY_AMOUNT, [...fixtureUnits]);

    // Same amounts in same order
    const csvAmounts = Array.from(csvSplits.values());
    const fixtureAmounts = Array.from(fixtureSplits.values());
    expect(csvAmounts).toEqual(fixtureAmounts);
  });
});

describe("Scenario: CSV import with owner emails for invite flow", () => {
  it("captures owner emails for units", () => {
    const csv = `identificador;piso;tipologia;permilagem;email
R/C Esq;0;T2;150;joao@email.pt
1.º Dto;1;T3;180;maria@email.pt
2.º Esq;2;T1;120;`;
    const result = parseCsvUnits(csv);
    expect(result.units).toHaveLength(3);
    expect(result.units[0].ownerEmail).toBe("joao@email.pt");
    expect(result.units[1].ownerEmail).toBe("maria@email.pt");
    expect(result.units[2].ownerEmail).toBeUndefined();
  });

  it("multiple units can share the same owner email", () => {
    const csv = `identificador;piso;permilagem;email
R/C Esq;0;150;joao@email.pt
R/C Dto;0;150;joao@email.pt
1.º Esq;1;180;maria@email.pt`;
    const result = parseCsvUnits(csv);
    expect(result.units).toHaveLength(3);
    const joaoUnits = result.units.filter((u) => u.ownerEmail === "joao@email.pt");
    expect(joaoUnits).toHaveLength(2);
  });

  it("collects unique owner emails for invite deduplication", () => {
    const csv = `identificador;piso;permilagem;email
R/C Esq;0;100;joao@email.pt
R/C Dto;0;100;joao@email.pt
1.º Esq;1;100;maria@email.pt
1.º Dto;1;100;pedro@email.pt
2.º Esq;2;100;pedro@email.pt`;
    const result = parseCsvUnits(csv);
    const uniqueEmails = new Set(
      result.units.map((u) => u.ownerEmail).filter(Boolean)
    );
    expect(uniqueEmails.size).toBe(3);
  });
});

describe("Scenario: CSV error handling", () => {
  it("rejects file with only header (no data rows)", () => {
    const result = parseCsvUnits("identificador;piso;permilagem");
    expect(result.errors).toHaveLength(1);
    expect(result.units).toHaveLength(0);
  });

  it("rejects file without identifier column", () => {
    const result = parseCsvUnits("piso;permilagem\nR/C;100");
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain("identificador");
  });

  it("reports row errors but continues parsing valid rows", () => {
    const csv = `identificador;permilagem
R/C Esq;100
;200
1.º Esq;abc
2.º Esq;150`;
    const result = parseCsvUnits(csv);
    // Row 3 has empty identifier, row 4 has invalid permilagem
    expect(result.errors).toHaveLength(2);
    // But rows 1 and 4 parsed fine
    expect(result.units).toHaveLength(2);
    expect(result.units[0].identifier).toBe("R/C Esq");
    expect(result.units[1].identifier).toBe("2.º Esq");
  });

  it("handles Windows-style line endings (CRLF)", () => {
    const csv = "identificador;permilagem\r\nR/C Esq;100\r\n1.º Dto;200\r\n";
    const result = parseCsvUnits(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.units).toHaveLength(2);
  });

  it("strips quotes from cell values", () => {
    const csv = `identificador;permilagem
"R/C Esq";"100"
'1.º Dto';'200'`;
    const result = parseCsvUnits(csv);
    expect(result.units[0].identifier).toBe("R/C Esq");
    expect(result.units[0].permilagem).toBe(100);
    expect(result.units[1].identifier).toBe("1.º Dto");
  });
});
