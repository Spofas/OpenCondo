/**
 * Calculate reserve fund balance.
 *
 * Portuguese law (DL 268/94) requires at least 10% of annual budget
 * goes to the reserve fund. The reserve fund grows with quota payments
 * and decreases with explicitly flagged withdrawals.
 *
 * For simplicity, we calculate: (total paid quotas * reserve %) - reserve withdrawals
 */

export interface ReserveFundSummary {
  /** Current reserve fund percentage from the latest approved budget */
  percentage: number;
  /** Total contributions (paid quotas * reserve %) */
  contributions: number;
  /** Total paid quota amount (used to calculate contributions) */
  totalPaidQuotas: number;
  /** Current balance */
  balance: number;
}

export function calculateReserveFund(
  totalPaidQuotas: number,
  reservePercentage: number
): ReserveFundSummary {
  const contributions = totalPaidQuotas * (reservePercentage / 100);

  return {
    percentage: reservePercentage,
    contributions,
    totalPaidQuotas,
    balance: Math.round(contributions * 100) / 100,
  };
}
