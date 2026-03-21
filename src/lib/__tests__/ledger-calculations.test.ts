import { describe, it, expect } from "vitest";
import {
  getBalanceAt,
  buildStatement,
  type LedgerEntry,
} from "../ledger-calculations";

const entries: LedgerEntry[] = [
  {
    id: "1",
    date: new Date("2026-01-01"),
    amount: 5000,
    type: "OPENING_BALANCE",
    description: "Saldo inicial",
    quotaId: null,
    expenseId: null,
  },
  {
    id: "2",
    date: new Date("2026-01-15"),
    amount: 120,
    type: "QUOTA_PAYMENT",
    description: "Quota 2026-01 — 1A",
    quotaId: "q1",
    expenseId: null,
  },
  {
    id: "3",
    date: new Date("2026-01-20"),
    amount: -80,
    type: "EXPENSE",
    description: "Electricidade",
    quotaId: null,
    expenseId: "e1",
  },
  {
    id: "4",
    date: new Date("2026-02-01"),
    amount: 120,
    type: "QUOTA_PAYMENT",
    description: "Quota 2026-01 — 2B",
    quotaId: "q2",
    expenseId: null,
  },
];

describe("getBalanceAt", () => {
  it("returns 0 before any entries", () => {
    expect(getBalanceAt(entries, new Date("2025-12-31"))).toBe(0);
  });

  it("includes entry on the exact date", () => {
    expect(getBalanceAt(entries, new Date("2026-01-01"))).toBe(5000);
  });

  it("sums entries through end of January", () => {
    expect(getBalanceAt(entries, new Date("2026-01-31"))).toBe(5040);
  });

  it("returns full balance including February", () => {
    expect(getBalanceAt(entries, new Date("2026-12-31"))).toBe(5160);
  });
});

describe("buildStatement", () => {
  it("returns correct opening, running balance rows, and closing", () => {
    const stmt = buildStatement(
      entries,
      new Date("2026-01-15"),
      new Date("2026-01-31")
    );
    expect(stmt.openingBalance).toBe(5000);
    expect(stmt.entries).toHaveLength(2);
    expect(stmt.entries[0].runningBalance).toBe(5120);
    expect(stmt.entries[1].runningBalance).toBe(5040);
    expect(stmt.closingBalance).toBe(5040);
  });

  it("empty period: closingBalance equals openingBalance", () => {
    const stmt = buildStatement(
      entries,
      new Date("2026-03-01"),
      new Date("2026-03-31")
    );
    expect(stmt.openingBalance).toBe(5160);
    expect(stmt.entries).toHaveLength(0);
    expect(stmt.closingBalance).toBe(5160);
  });

  it("full range includes all entries", () => {
    const stmt = buildStatement(
      entries,
      new Date("2026-01-01"),
      new Date("2026-12-31")
    );
    expect(stmt.openingBalance).toBe(0);
    expect(stmt.entries).toHaveLength(4);
    expect(stmt.closingBalance).toBe(5160);
  });

  it("handles negative adjustment correctly", () => {
    const withAdjustment: LedgerEntry[] = [
      ...entries,
      {
        id: "5",
        date: new Date("2026-02-15"),
        amount: -200,
        type: "ADJUSTMENT",
        description: "Correção manual",
        quotaId: null,
        expenseId: null,
      },
    ];
    const stmt = buildStatement(
      withAdjustment,
      new Date("2026-01-01"),
      new Date("2026-12-31")
    );
    expect(stmt.closingBalance).toBe(4960);
  });
});
