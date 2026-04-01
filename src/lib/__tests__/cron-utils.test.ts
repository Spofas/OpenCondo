import { describe, it, expect } from "vitest";
import { isDueThisPeriod, periodSuffix } from "../cron-utils";

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

describe("periodSuffix — MENSAL", () => {
  it("returns Portuguese month name + year", () => {
    expect(periodSuffix("MENSAL", new Date(2026, 0, 15))).toBe("Janeiro 2026");
    expect(periodSuffix("MENSAL", new Date(2026, 2, 15))).toBe("Março 2026");
    expect(periodSuffix("MENSAL", new Date(2026, 11, 15))).toBe("Dezembro 2026");
  });
});

describe("periodSuffix — TRIMESTRAL", () => {
  it("returns correct quarter", () => {
    expect(periodSuffix("TRIMESTRAL", new Date(2026, 0, 15))).toBe("Q1 2026");
    expect(periodSuffix("TRIMESTRAL", new Date(2026, 3, 15))).toBe("Q2 2026");
    expect(periodSuffix("TRIMESTRAL", new Date(2026, 6, 15))).toBe("Q3 2026");
    expect(periodSuffix("TRIMESTRAL", new Date(2026, 9, 15))).toBe("Q4 2026");
  });
});

describe("periodSuffix — SEMESTRAL", () => {
  it("returns 1st semester for Jan-Jun", () => {
    expect(periodSuffix("SEMESTRAL", new Date(2026, 0, 15))).toBe("1.º Sem. 2026");
    expect(periodSuffix("SEMESTRAL", new Date(2026, 5, 15))).toBe("1.º Sem. 2026");
  });

  it("returns 2nd semester for Jul-Dec", () => {
    expect(periodSuffix("SEMESTRAL", new Date(2026, 6, 15))).toBe("2.º Sem. 2026");
    expect(periodSuffix("SEMESTRAL", new Date(2026, 11, 15))).toBe("2.º Sem. 2026");
  });
});

describe("periodSuffix — ANUAL", () => {
  it("returns just the year", () => {
    expect(periodSuffix("ANUAL", new Date(2026, 0, 15))).toBe("2026");
    expect(periodSuffix("ANUAL", new Date(2025, 0, 15))).toBe("2025");
  });
});

describe("periodSuffix — unknown frequency", () => {
  it("falls back to month + year", () => {
    expect(periodSuffix("PONTUAL", new Date(2026, 2, 15))).toBe("Março 2026");
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
