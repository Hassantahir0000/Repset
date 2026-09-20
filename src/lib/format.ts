/**
 * Money for display: grouped thousands, and decimals only when the amount
 * actually has them. Gym pricing is overwhelmingly whole units, so showing
 * "PKR 15,000" rather than "PKR 15,000.00" keeps the KPI tiles readable.
 */
export function formatMoney(currency: string, amount: number): string {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return `${currency} ${amount.toLocaleString("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}
