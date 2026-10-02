/**
 * Formats a monetary number into Ghana Cedis (GH₵)
 */
export const formatGHS = (amount: number | string | undefined | null): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
  if (isNaN(num)) return 'GH₵ 0.00';
  return `GH₵ ${num.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const CURRENCY_SYMBOL = 'GH₵';
