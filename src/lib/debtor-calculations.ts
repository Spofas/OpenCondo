/**
 * Debtor tracking calculations.
 *
 * Computes aging buckets and debt summaries per unit,
 * based on unpaid quotas (PENDING + OVERDUE).
 */

export interface DebtorUnit {
  unitId: string;
  unitIdentifier: string;
  unitFloor: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  /** Total unpaid amount */
  totalDebt: number;
  /** Number of unpaid quotas */
  unpaidCount: number;
  /** Aging buckets in euros */
  current: number;     // not yet due (PENDING, dueDate >= today)
  overdue30: number;   // 1-30 days overdue
  overdue60: number;   // 31-60 days overdue
  overdue90: number;   // 61-90 days overdue
  overdue90Plus: number; // 90+ days overdue
  /** Oldest unpaid due date */
  oldestDueDate: string | null;
}

export interface DebtorSummary {
  totalDebt: number;
  totalOverdue: number;
  unitsWithDebt: number;
  unitsWithOverdue: number;
  debtors: DebtorUnit[];
}

export interface QuotaForDebtor {
  unitId: string;
  unitIdentifier: string;
  unitFloor: number | null;
  ownerName: string | null;
  ownerEmail: string | null;
  amount: number;
  dueDate: string; // ISO date string
  status: "PENDING" | "OVERDUE";
}

export function buildDebtorSummary(
  quotas: QuotaForDebtor[],
  today: Date = new Date()
): DebtorSummary {
  const todayMs = today.getTime();
  const DAY = 86400000;

  const unitMap = new Map<string, DebtorUnit>();

  for (const q of quotas) {
    let entry = unitMap.get(q.unitId);
    if (!entry) {
      entry = {
        unitId: q.unitId,
        unitIdentifier: q.unitIdentifier,
        unitFloor: q.unitFloor,
        ownerName: q.ownerName,
        ownerEmail: q.ownerEmail,
        totalDebt: 0,
        unpaidCount: 0,
        current: 0,
        overdue30: 0,
        overdue60: 0,
        overdue90: 0,
        overdue90Plus: 0,
        oldestDueDate: null,
      };
      unitMap.set(q.unitId, entry);
    }

    entry.totalDebt += q.amount;
    entry.unpaidCount += 1;

    const dueDateMs = new Date(q.dueDate).getTime();
    const daysOverdue = Math.floor((todayMs - dueDateMs) / DAY);

    if (daysOverdue <= 0) {
      entry.current += q.amount;
    } else if (daysOverdue <= 30) {
      entry.overdue30 += q.amount;
    } else if (daysOverdue <= 60) {
      entry.overdue60 += q.amount;
    } else if (daysOverdue <= 90) {
      entry.overdue90 += q.amount;
    } else {
      entry.overdue90Plus += q.amount;
    }

    if (!entry.oldestDueDate || q.dueDate < entry.oldestDueDate) {
      entry.oldestDueDate = q.dueDate;
    }
  }

  const debtors = Array.from(unitMap.values())
    .map((d) => ({
      ...d,
      totalDebt: round(d.totalDebt),
      current: round(d.current),
      overdue30: round(d.overdue30),
      overdue60: round(d.overdue60),
      overdue90: round(d.overdue90),
      overdue90Plus: round(d.overdue90Plus),
    }))
    .sort((a, b) => {
      const fa = a.unitFloor ?? Infinity;
      const fb = b.unitFloor ?? Infinity;
      if (fa !== fb) return fa - fb;
      return a.unitIdentifier.localeCompare(b.unitIdentifier, "pt");
    });

  const totalDebt = round(debtors.reduce((s, d) => s + d.totalDebt, 0));
  const totalOverdue = round(
    debtors.reduce(
      (s, d) => s + d.overdue30 + d.overdue60 + d.overdue90 + d.overdue90Plus,
      0
    )
  );
  const unitsWithDebt = debtors.length;
  const unitsWithOverdue = debtors.filter(
    (d) => d.overdue30 + d.overdue60 + d.overdue90 + d.overdue90Plus > 0
  ).length;

  return { totalDebt, totalOverdue, unitsWithDebt, unitsWithOverdue, debtors };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
