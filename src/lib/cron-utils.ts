/**
 * Pure utility functions used by the nightly cron job.
 * Extracted here so they can be unit-tested independently of the Next.js route.
 */

const MONTH_NAMES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

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

/**
 * Generates a period suffix for a recurring expense description based on frequency.
 *
 * MENSAL     → "Março 2026"
 * TRIMESTRAL → "Q1 2026" (Q1=Jan-Mar, Q2=Apr-Jun, Q3=Jul-Sep, Q4=Oct-Dec)
 * SEMESTRAL  → "1.º Sem. 2026" / "2.º Sem. 2026"
 * ANUAL      → "2026"
 */
export function periodSuffix(frequency: string, now: Date): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  switch (frequency) {
    case "MENSAL":
      return `${MONTH_NAMES_PT[month - 1]} ${year}`;
    case "TRIMESTRAL": {
      const quarter = Math.ceil(month / 3);
      return `Q${quarter} ${year}`;
    }
    case "SEMESTRAL":
      return month <= 6 ? `1.º Sem. ${year}` : `2.º Sem. ${year}`;
    case "ANUAL":
      return `${year}`;
    default:
      return `${MONTH_NAMES_PT[month - 1]} ${year}`;
  }
}
