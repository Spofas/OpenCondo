/**
 * Pure business logic for quota calculations.
 * Extracted from server actions so it can be unit-tested without Next.js dependencies.
 */

interface UnitForSplit {
  id: string;
  permilagem: number;
}

/**
 * Calculate quota amount per unit using permilagem-based proportional split.
 * Each unit pays (totalAmount * unitPermilagem / totalPermilagem), rounded to 2 decimal places.
 */
export function splitByPermilagem(
  totalAmount: number,
  units: UnitForSplit[]
): Map<string, number> {
  const result = new Map<string, number>();
  const totalPermilagem = units.reduce((sum, u) => sum + u.permilagem, 0);

  if (totalPermilagem === 0) return result;

  for (const unit of units) {
    const amount =
      Math.round((totalAmount * unit.permilagem * 100) / totalPermilagem) / 100;
    result.set(unit.id, amount);
  }

  return result;
}

/**
 * Calculate quota amount per unit using equal split.
 * Each unit pays (totalAmount / numberOfUnits), rounded to 2 decimal places.
 */
export function splitEqually(
  totalAmount: number,
  units: UnitForSplit[]
): Map<string, number> {
  const result = new Map<string, number>();

  if (units.length === 0) return result;

  const amount = Math.round((totalAmount * 100) / units.length) / 100;

  for (const unit of units) {
    result.set(unit.id, amount);
  }

  return result;
}

/**
 * Generate an array of month strings ("YYYY-MM") for a given range (inclusive).
 * Returns empty array if startMonth > endMonth.
 */
export function generateMonthRange(
  startMonth: string,
  endMonth: string
): string[] {
  const months: string[] = [];
  const [startYear, startMon] = startMonth.split("-").map(Number);
  const [endYear, endMon] = endMonth.split("-").map(Number);

  let year = startYear;
  let month = startMon;

  while (year < endYear || (year === endYear && month <= endMon)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return months;
}

/**
 * Determine what status a quota should have after undoing a payment.
 * If the due date is in the past, it becomes OVERDUE; otherwise PENDING.
 */
export function statusAfterUndo(
  dueDate: Date,
  now: Date = new Date()
): "PENDING" | "OVERDUE" {
  return dueDate < now ? "OVERDUE" : "PENDING";
}
