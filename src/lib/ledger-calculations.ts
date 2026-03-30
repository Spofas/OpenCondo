export interface LedgerEntry {
  id: string;
  date: Date;
  amount: number;
  type: string;
  description: string;
  quotaId: string | null;
  expenseId: string | null;
}

export interface LedgerRow extends LedgerEntry {
  runningBalance: number;
}

export interface LedgerStatement {
  openingBalance: number;
  entries: LedgerRow[];
  closingBalance: number;
}

/**
 * Sum all entries up to and including the given date.
 */
export function getBalanceAt(entries: LedgerEntry[], upTo: Date): number {
  return entries
    .filter((e) => e.date <= upTo)
    .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Build a statement for a given date range, including:
 * - Opening balance (sum of all entries before `from`)
 * - Entries within [from, to] with running balance column
 * - Closing balance
 *
 * Entries must be sorted by date ascending before calling this.
 */
export function buildStatement(
  entries: LedgerEntry[],
  from: Date,
  to: Date
): LedgerStatement {
  // Sum everything strictly before the period start
  const justBeforeFrom = new Date(from.getTime() - 1);
  const openingBalance = getBalanceAt(entries, justBeforeFrom);

  const periodEntries = entries.filter((e) => e.date >= from && e.date <= to);

  let runningBalance = openingBalance;
  const rows: LedgerRow[] = periodEntries.map((e) => {
    runningBalance += e.amount;
    return { ...e, runningBalance };
  });

  return {
    openingBalance,
    entries: rows,
    closingBalance: runningBalance,
  };
}
