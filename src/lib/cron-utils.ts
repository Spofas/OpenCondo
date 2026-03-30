/**
 * Pure utility functions used by the nightly cron job.
 * Extracted here so they can be unit-tested independently of the Next.js route.
 */

/**
 * Returns true if the given recurring expense frequency is due in the month
 * of the supplied date.
 *
 * MENSAL     — every month
 * TRIMESTRAL — every 3 months: Jan, Apr, Jul, Oct
 * SEMESTRAL  — every 6 months: Jan, Jul
 * ANUAL      — January only
 * PONTUAL    — never auto-generated (manual only)
 */
export function isDueThisPeriod(frequency: string, now: Date): boolean {
  const month = now.getMonth() + 1; // 1-indexed
  switch (frequency) {
    case "MENSAL":
      return true;
    case "TRIMESTRAL":
      return month % 3 === 1; // Jan(1), Apr(4), Jul(7), Oct(10)
    case "SEMESTRAL":
      return month === 1 || month === 7;
    case "ANUAL":
      return month === 1;
    default:
      return false; // PONTUAL and unknown — manual only
  }
}
