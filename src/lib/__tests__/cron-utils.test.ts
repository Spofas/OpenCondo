import { describe, it, expect } from "vitest";
import { isDueThisPeriod } from "../cron-utils";

function date(month: number): Date {
  return new Date(2026, month - 1, 15); // 15th of the given month, 1-indexed
}

describe("isDueThisPeriod — MENSAL", () => {
  it("fires every month of the year", () => {
    for (let m = 1; m <= 12; m++) {
      expect(isDueThisPeriod("MENSAL", date(m))).toBe(true);
    }
  });
});

describe("isDueThisPeriod — TRIMESTRAL", () => {
  it("fires in January, April, July, October", () => {
    expect(isDueThisPeriod("TRIMESTRAL", date(1))).toBe(true);
    expect(isDueThisPeriod("TRIMESTRAL", date(4))).toBe(true);
    expect(isDueThisPeriod("TRIMESTRAL", date(7))).toBe(true);
    expect(isDueThisPeriod("TRIMESTRAL", date(10))).toBe(true);
  });

  it("does not fire in other months", () => {
    for (const m of [2, 3, 5, 6, 8, 9, 11, 12]) {
      expect(isDueThisPeriod("TRIMESTRAL", date(m))).toBe(false);
    }
  });

  it("fires exactly 4 times per year", () => {
    const count = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) =>
      isDueThisPeriod("TRIMESTRAL", date(m))
    ).length;
    expect(count).toBe(4);
  });
});

describe("isDueThisPeriod — SEMESTRAL", () => {
  it("fires in January and July", () => {
    expect(isDueThisPeriod("SEMESTRAL", date(1))).toBe(true);
    expect(isDueThisPeriod("SEMESTRAL", date(7))).toBe(true);
  });

  it("does not fire in other months", () => {
    for (const m of [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]) {
      expect(isDueThisPeriod("SEMESTRAL", date(m))).toBe(false);
    }
  });

  it("fires exactly 2 times per year", () => {
    const count = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) =>
      isDueThisPeriod("SEMESTRAL", date(m))
    ).length;
    expect(count).toBe(2);
  });
});

describe("isDueThisPeriod — ANUAL", () => {
  it("fires only in January", () => {
    expect(isDueThisPeriod("ANUAL", date(1))).toBe(true);
  });

  it("does not fire in any other month", () => {
    for (let m = 2; m <= 12; m++) {
      expect(isDueThisPeriod("ANUAL", date(m))).toBe(false);
    }
  });

  it("fires exactly once per year", () => {
    const count = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) =>
      isDueThisPeriod("ANUAL", date(m))
    ).length;
    expect(count).toBe(1);
  });
});

describe("isDueThisPeriod — PONTUAL and unknown", () => {
  it("never fires for PONTUAL", () => {
    for (let m = 1; m <= 12; m++) {
      expect(isDueThisPeriod("PONTUAL", date(m))).toBe(false);
    }
  });

  it("never fires for unknown frequency strings", () => {
    expect(isDueThisPeriod("WEEKLY", date(1))).toBe(false);
    expect(isDueThisPeriod("", date(6))).toBe(false);
    expect(isDueThisPeriod("RANDOM", date(3))).toBe(false);
  });
});

describe("isDueThisPeriod — cron-utils vs scenario-recurring-expenses agreement", () => {
  // The scenario test used a separate reimplementation (shouldGenerate). This
  // test verifies the actual cron function agrees with it on all months/frequencies.
  const frequencies = ["MENSAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"];

  it("agrees with FREQUENCY_MONTHS-based logic for all frequencies and months", () => {
    const FREQUENCY_MONTHS: Record<string, number> = {
      MENSAL: 1,
      TRIMESTRAL: 3,
      SEMESTRAL: 6,
      ANUAL: 12,
    };
    function shouldGenerate(frequency: string, month: number): boolean {
      const freqMonths = FREQUENCY_MONTHS[frequency] ?? 1;
      if (freqMonths === 1) return true;
      return month % freqMonths === 1;
    }

    for (const freq of frequencies) {
      for (let m = 1; m <= 12; m++) {
        const cronResult = isDueThisPeriod(freq, date(m));
        const scenarioResult = shouldGenerate(freq, m);
        expect(cronResult).toBe(scenarioResult);
      }
    }
  });
});
