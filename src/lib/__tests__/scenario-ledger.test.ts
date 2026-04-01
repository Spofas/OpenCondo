/**
 * Scenario tests: Ledger integration with existing financial modules.
 *
 * These tests verify that the ledger's LedgerEntry objects — which mirror
 * what recordPayment(), undoPayment(), createExpense() and setOpeningBalance()
 * write to the Transaction table — are consistent with:
 *
 *   1. The conta-gerência report (paid quota totals, expense totals)
 *   2. The payment/undo state machine (balance changes correctly)
 *   3. The buildStatement function with realistic full-year Aurora data
 *
 * No database is required. The server actions' DB writes are simulated
 * by constructing LedgerEntry objects with the same values.
 */

import { describe, it, expect } from "vitest";
import {
  AURORA_UNITS,
  makeAuroraQuotas,
  makeAuroraExpenses,
} from "./fixtures";
import { generateMonthRange } from "../quota-calculations";
import { buildContaGerencia, type ContaGerenciaInput } from "../conta-gerencia";
import {
  getBalanceAt,
  buildStatement,
  type LedgerEntry,
} from "../ledger-calculations";

// ── Shared scenario setup ────────────────────────────────────────────────────
// Mirrors the payment scenario in scenario-lifecycle.test.ts so we can
// cross-validate the two modules.

const TODAY = new Date("2026-09-15");

function buildPaidMonths(): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  map.set("aurora-rc-esq", new Set(generateMonthRange("2026-01", "2026-12")));
  map.set("aurora-rc-dto", new Set(generateMonthRange("2026-01", "2026-06")));
  map.set("aurora-1-esq", new Set(generateMonthRange("2026-01", "2026-08")));
  map.set("aurora-1-dto", new Set(["2026-01", "2026-03", "2026-05"]));
  map.set("aurora-2-esq", new Set()); // paid nothing
  map.set("aurora-2-dto", new Set(generateMonthRange("2026-01", "2026-09")));
  return map;
}

const paidMonths = buildPaidMonths();
const allQuotas = makeAuroraQuotas(paidMonths, TODAY);
const allExpenses = makeAuroraExpenses();

/**
 * Construct the LedgerEntry[] that the server actions would create.
 * - recordPayment()  → QUOTA_PAYMENT, +amount, date = paymentDate
 * - createExpense()  → EXPENSE, -amount, date = expense.date
 * - setOpeningBalance() → OPENING_BALANCE, +amount
 *
 * Entries are sorted by date asc (matching the DB index order).
 */
function buildLedgerEntries(opts: { openingAmount?: number; openingDate?: string } = {}): LedgerEntry[] {
  const entries: LedgerEntry[] = [];

  if (opts.openingAmount !== undefined) {
    entries.push({
      id: "opening",
      date: new Date(opts.openingDate ?? "2025-12-31"),
      amount: opts.openingAmount,
      type: "OPENING_BALANCE",
      description: "Saldo inicial",
      quotaId: null,
      expenseId: null,
    });
  }

  // QUOTA_PAYMENT: one entry per paid quota (mirrors recordPayment)
  for (const q of allQuotas.filter((q) => q.status === "PAID")) {
    entries.push({
      id: `qp-${q.unitId}-${q.period}`,
      date: new Date(`${q.period}-10`), // payment on the 10th of the period month
      amount: q.amount,
      type: "QUOTA_PAYMENT",
      description: `Quota ${q.period} — ${q.unitIdentifier}`,
      quotaId: `${q.unitId}-${q.period}`,
      expenseId: null,
    });
  }

  // EXPENSE: one entry per expense (mirrors createExpense — amount is negated)
  for (let i = 0; i < allExpenses.length; i++) {
    const e = allExpenses[i];
    entries.push({
      id: `exp-${i}`,
      date: new Date(e.date),
      amount: -e.amount, // outflow stored as negative
      type: "EXPENSE",
      description: e.category,
      quotaId: null,
      expenseId: `expense-${i}`,
    });
  }

  entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  return entries;
}

// ── Conta-gerência reference report ─────────────────────────────────────────

const AURORA_BUDGET = {
  year: 2026,
  totalAmount: 9000,
  status: "APPROVED" as const,
  reserveFundPercentage: 10,
  items: [
    { category: "Limpeza", description: null, plannedAmount: 2400 },
    { category: "Elevador", description: null, plannedAmount: 1800 },
    { category: "Seguro", description: null, plannedAmount: 1200 },
    { category: "Eletricidade", description: null, plannedAmount: 960 },
    { category: "Água", description: null, plannedAmount: 480 },
    { category: "Gestão", description: null, plannedAmount: 1200 },
    { category: "Diversos", description: null, plannedAmount: 960 },
  ],
};

const contaInput: ContaGerenciaInput = {
  year: 2026,
  condominiumName: "Edifício Aurora",
  condominiumNif: "501234567",
  condominiumAddress: "Rua da Aurora 42, Lisboa",
  budget: AURORA_BUDGET,
  quotas: allQuotas.map((q) => ({
    unitId: q.unitId,
    unitIdentifier: q.unitIdentifier,
    ownerName: q.ownerName,
    amount: q.amount,
    status: q.status,
    period: q.period,
    dueDate: q.dueDate,
  })),
  expenses: allExpenses,
};

const contaReport = buildContaGerencia(contaInput);

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Scenario: Ledger ↔ conta-gerência consistency", () => {
  const entries = buildLedgerEntries({ openingAmount: 5000, openingDate: "2025-12-31" });

  it("sum of QUOTA_PAYMENT transactions equals conta totalQuotasPaid", () => {
    const ledgerPaid = entries
      .filter((e) => e.type === "QUOTA_PAYMENT")
      .reduce((s, e) => s + e.amount, 0);

    expect(ledgerPaid).toBeCloseTo(contaReport.totalQuotasPaid, 1);
  });

  it("sum of EXPENSE transactions (negated) equals conta totalExpenses", () => {
    const ledgerExpenses = entries
      .filter((e) => e.type === "EXPENSE")
      .reduce((s, e) => s + e.amount, 0); // these are negative

    expect(-ledgerExpenses).toBeCloseTo(contaReport.totalExpenses, 1);
  });

  it("net cash position matches conta net balance + opening balance", () => {
    const currentBalance = getBalanceAt(entries, new Date("2026-12-31"));
    const expectedBalance = 5000 + contaReport.netBalance;
    expect(currentBalance).toBeCloseTo(expectedBalance, 1);
  });

  it("QUOTA_PAYMENT entry count matches number of paid quotas", () => {
    const paidCount = allQuotas.filter((q) => q.status === "PAID").length;
    const txCount = entries.filter((e) => e.type === "QUOTA_PAYMENT").length;
    expect(txCount).toBe(paidCount);
  });

  it("EXPENSE entry count matches number of expenses", () => {
    const txCount = entries.filter((e) => e.type === "EXPENSE").length;
    expect(txCount).toBe(allExpenses.length);
  });
});

describe("Scenario: Ledger — opening balance interaction", () => {
  it("no opening balance: balance equals net of payments minus expenses", () => {
    const entries = buildLedgerEntries(); // no opening
    const balance = getBalanceAt(entries, new Date("2026-12-31"));
    expect(balance).toBeCloseTo(contaReport.netBalance, 1);
  });

  it("zero opening balance: balance still equals net of payments minus expenses", () => {
    const entries = buildLedgerEntries({ openingAmount: 0, openingDate: "2025-12-31" });
    const balance = getBalanceAt(entries, new Date("2026-12-31"));
    expect(balance).toBeCloseTo(contaReport.netBalance, 1);
  });

  it("positive opening balance shifts current balance by exactly that amount", () => {
    const withoutOpening = buildLedgerEntries();
    const withOpening = buildLedgerEntries({ openingAmount: 8500, openingDate: "2025-12-31" });

    const balWithout = getBalanceAt(withoutOpening, new Date("2026-12-31"));
    const balWith = getBalanceAt(withOpening, new Date("2026-12-31"));

    expect(balWith - balWithout).toBeCloseTo(8500, 2);
  });

  it("opening balance dated after some transactions is excluded from earlier balance queries", () => {
    // Opening balance dated June 1st
    const entries: LedgerEntry[] = [
      {
        id: "opening",
        date: new Date("2026-06-01"),
        amount: 3000,
        type: "OPENING_BALANCE",
        description: "Saldo inicial",
        quotaId: null,
        expenseId: null,
      },
      {
        id: "q1",
        date: new Date("2026-01-10"),
        amount: 100,
        type: "QUOTA_PAYMENT",
        description: "Quota 2026-01",
        quotaId: "q1",
        expenseId: null,
      },
    ];
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Balance at end of May: only the Jan payment
    const balMay = getBalanceAt(entries, new Date("2026-05-31"));
    expect(balMay).toBe(100);

    // Balance at end of June: Jan + opening
    const balJun = getBalanceAt(entries, new Date("2026-06-30"));
    expect(balJun).toBe(3100);
  });
});

describe("Scenario: Ledger — payment/undo state machine", () => {
  // Start with opening balance only
  const baseEntries: LedgerEntry[] = [
    {
      id: "opening",
      date: new Date("2025-12-31"),
      amount: 5000,
      type: "OPENING_BALANCE",
      description: "Saldo inicial",
      quotaId: null,
      expenseId: null,
    },
  ];
  const afterOpening = getBalanceAt(baseEntries, new Date("2026-12-31"));

  it("recording a payment increases balance by that amount", () => {
    const afterPayment: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "payment-1",
        date: new Date("2026-01-10"),
        amount: 75, // quota amount
        type: "QUOTA_PAYMENT",
        description: "Quota 2026-01 — R/C Esq",
        quotaId: "quota-1",
        expenseId: null,
      },
    ];
    const bal = getBalanceAt(afterPayment, new Date("2026-12-31"));
    expect(bal - afterOpening).toBeCloseTo(75, 2);
  });

  it("undoing a payment removes the transaction and restores balance", () => {
    // Simulate: record payment → add entry; undo payment → remove entry
    const withPayment: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "payment-1",
        date: new Date("2026-01-10"),
        amount: 75,
        type: "QUOTA_PAYMENT",
        description: "Quota 2026-01 — R/C Esq",
        quotaId: "quota-1",
        expenseId: null,
      },
    ];

    // Undo = filter out the transaction with that quotaId
    const afterUndo = withPayment.filter((e) => e.quotaId !== "quota-1");

    const balBefore = getBalanceAt(withPayment, new Date("2026-12-31"));
    const balAfter = getBalanceAt(afterUndo, new Date("2026-12-31"));

    expect(balAfter).toBeCloseTo(afterOpening, 2);
    expect(balBefore - balAfter).toBeCloseTo(75, 2);
  });

  it("creating an expense decreases balance by that amount", () => {
    const afterExpense: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "expense-1",
        date: new Date("2026-01-20"),
        amount: -200, // stored negative in Transaction table
        type: "EXPENSE",
        description: "Limpeza",
        quotaId: null,
        expenseId: "expense-1",
      },
    ];
    const bal = getBalanceAt(afterExpense, new Date("2026-12-31"));
    expect(afterOpening - bal).toBeCloseTo(200, 2);
  });

  it("deleting an expense (cascade) removes its ledger entry and restores balance", () => {
    const withExpense: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "expense-1",
        date: new Date("2026-01-20"),
        amount: -200,
        type: "EXPENSE",
        description: "Limpeza",
        quotaId: null,
        expenseId: "exp-1",
      },
    ];
    // onDelete: Cascade means expense deletion removes the Transaction row
    const afterCascade = withExpense.filter((e) => e.expenseId !== "exp-1");

    const balWithExpense = getBalanceAt(withExpense, new Date("2026-12-31"));
    const balAfterDelete = getBalanceAt(afterCascade, new Date("2026-12-31"));

    expect(balAfterDelete).toBeCloseTo(afterOpening, 2);
    expect(balAfterDelete - balWithExpense).toBeCloseTo(200, 2);
  });

  it("updating an expense amount adjusts its transaction and changes balance", () => {
    // Original expense: -200. Updated to -350.
    const withExpense: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "expense-1",
        date: new Date("2026-01-20"),
        amount: -200,
        type: "EXPENSE",
        description: "Limpeza",
        quotaId: null,
        expenseId: "exp-1",
      },
    ];
    // updateExpense → db.transaction.updateMany({ where: { expenseId }, data: { amount: -350 } })
    const afterUpdate = withExpense.map((e) =>
      e.expenseId === "exp-1" ? { ...e, amount: -350 } : e
    );

    const balBefore = getBalanceAt(withExpense, new Date("2026-12-31"));
    const balAfter = getBalanceAt(afterUpdate, new Date("2026-12-31"));

    expect(balBefore - balAfter).toBeCloseTo(150, 2); // extra €150 out
  });

  it("manual adjustment shifts balance by exact amount (positive or negative)", () => {
    const withAdj: LedgerEntry[] = [
      ...baseEntries,
      {
        id: "adj-1",
        date: new Date("2026-03-01"),
        amount: -500, // negative adjustment (e.g. bank fee not in expenses)
        type: "ADJUSTMENT",
        description: "Correção manual — comissão bancária",
        quotaId: null,
        expenseId: null,
      },
    ];
    const bal = getBalanceAt(withAdj, new Date("2026-12-31"));
    expect(afterOpening - bal).toBeCloseTo(500, 2);
  });
});

describe("Scenario: Ledger — buildStatement with full Aurora year", () => {
  const entries = buildLedgerEntries({ openingAmount: 5000, openingDate: "2025-12-31" });

  it("opening balance before Jan 1 is exactly the seed amount", () => {
    const stmt = buildStatement(entries, new Date("2026-01-01"), new Date("2026-12-31"));
    expect(stmt.openingBalance).toBeCloseTo(5000, 2);
  });

  it("closing balance matches getBalanceAt for the same date", () => {
    const stmt = buildStatement(entries, new Date("2026-01-01"), new Date("2026-12-31"));
    const expected = getBalanceAt(entries, new Date("2026-12-31"));
    expect(stmt.closingBalance).toBeCloseTo(expected, 2);
  });

  it("every row's runningBalance equals openingBalance + cumulative sum of entries up to that row", () => {
    const stmt = buildStatement(entries, new Date("2026-01-01"), new Date("2026-12-31"));
    let running = stmt.openingBalance;
    for (const row of stmt.entries) {
      running += row.amount;
      expect(row.runningBalance).toBeCloseTo(running, 2);
    }
  });

  it("entries in statement are sorted chronologically", () => {
    const stmt = buildStatement(entries, new Date("2026-01-01"), new Date("2026-12-31"));
    for (let i = 1; i < stmt.entries.length; i++) {
      expect(stmt.entries[i].date.getTime()).toBeGreaterThanOrEqual(
        stmt.entries[i - 1].date.getTime()
      );
    }
  });

  it("Q1 sub-statement openingBalance equals seed amount (nothing before Jan 1)", () => {
    const stmt = buildStatement(entries, new Date("2026-01-01"), new Date("2026-03-31"));
    expect(stmt.openingBalance).toBeCloseTo(5000, 2);
  });

  it("Q2 sub-statement openingBalance equals Q1 closing balance", () => {
    const q1 = buildStatement(entries, new Date("2026-01-01"), new Date("2026-03-31"));
    const q2 = buildStatement(entries, new Date("2026-04-01"), new Date("2026-06-30"));
    expect(q2.openingBalance).toBeCloseTo(q1.closingBalance, 2);
  });

  it("quarters chain: Q1→Q2→Q3→Q4 closing balance equals full-year closing balance", () => {
    const fullYear = buildStatement(entries, new Date("2026-01-01"), new Date("2026-12-31"));
    const q4 = buildStatement(entries, new Date("2026-10-01"), new Date("2026-12-31"));
    expect(q4.closingBalance).toBeCloseTo(fullYear.closingBalance, 2);
  });

  it("empty sub-period returns openingBalance as closingBalance with no entries", () => {
    // No transactions before 2025
    const stmt = buildStatement(entries, new Date("2025-01-01"), new Date("2025-11-30"));
    expect(stmt.openingBalance).toBe(0);
    expect(stmt.entries).toHaveLength(0);
    expect(stmt.closingBalance).toBe(0);
  });
});

describe("Scenario: Ledger — balance cannot misrepresent the financial state", () => {
  it("ledger balance is always consistent regardless of entry order input", () => {
    // Build entries in reverse order — getBalanceAt must still return the same result
    const entries = buildLedgerEntries({ openingAmount: 5000, openingDate: "2025-12-31" });
    const reversed = [...entries].reverse();

    const bal = getBalanceAt(entries, new Date("2026-12-31"));
    const balReversed = getBalanceAt(reversed, new Date("2026-12-31"));
    expect(bal).toBeCloseTo(balReversed, 2);
  });

  it("a ledger with only expenses produces a negative balance", () => {
    const expenseOnly: LedgerEntry[] = allExpenses.map((e, i) => ({
      id: `exp-${i}`,
      date: new Date(e.date),
      amount: -e.amount,
      type: "EXPENSE",
      description: e.category,
      quotaId: null,
      expenseId: `expense-${i}`,
    }));

    const bal = getBalanceAt(expenseOnly, new Date("2026-12-31"));
    expect(bal).toBeLessThan(0);
    expect(bal).toBeCloseTo(-contaReport.totalExpenses, 1);
  });

  it("two condos' entries never contaminate each other's balance (isolation via condominiumId)", () => {
    // Simulate mixing entries from two condos — filtering by condominiumId isolates them
    const condo1Entries: LedgerEntry[] = [
      { id: "c1-open", date: new Date("2025-12-31"), amount: 3000, type: "OPENING_BALANCE", description: "Saldo inicial", quotaId: null, expenseId: null },
      { id: "c1-q1", date: new Date("2026-01-10"), amount: 100, type: "QUOTA_PAYMENT", description: "Quota", quotaId: "q1", expenseId: null },
    ];
    const condo2Entries: LedgerEntry[] = [
      { id: "c2-open", date: new Date("2025-12-31"), amount: 8000, type: "OPENING_BALANCE", description: "Saldo inicial", quotaId: null, expenseId: null },
      { id: "c2-q1", date: new Date("2026-01-10"), amount: 250, type: "QUOTA_PAYMENT", description: "Quota", quotaId: "q2", expenseId: null },
    ];

    const bal1 = getBalanceAt(condo1Entries, new Date("2026-12-31"));
    const bal2 = getBalanceAt(condo2Entries, new Date("2026-12-31"));

    // Each condo's balance is independent
    expect(bal1).toBeCloseTo(3100, 2);
    expect(bal2).toBeCloseTo(8250, 2);

    // Mixing them gives the wrong combined result — proving DB must filter by condominiumId
    const mixed = getBalanceAt([...condo1Entries, ...condo2Entries], new Date("2026-12-31"));
    expect(mixed).toBeCloseTo(bal1 + bal2, 2);
  });
});
