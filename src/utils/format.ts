/**
 * Format a number as currency.
 * In Bangla locale: uses bn-BD which natively produces Bangla numerals & separators (e.g. ৳১,২৩৪)
 * In English locale: standard en-US format (e.g. ৳1,234)
 *
 * Defaults to whole-taka display, rounded UP (ceiling) — customer-facing amounts
 * (cart, checkout, invoices, orders) should never show paisa fractions. Pass
 * `decimals=2` explicitly for accounting contexts (ledger, journal, trial balance,
 * profit & loss) where exact figures must be preserved so debits/credits balance.
 */
export function formatAmount(amount: number | string, locale: string, decimals = 0): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '৳0'
  const displayNum = decimals === 0 ? Math.ceil(num) : num
  const formatted = displayNum.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `৳${formatted}`
}

/**
 * Calculate the effective (discounted) price of a product.
 */
export function calcDiscountedPrice(unitPrice: string | number, discountType: string, discountValue: string | number): number {
  const price = typeof unitPrice === 'string' ? parseFloat(unitPrice) : unitPrice
  const value = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue
  if (discountType === 'PERCENTAGE') return Math.max(0, price * (1 - value / 100))
  if (discountType === 'FLAT')       return Math.max(0, price - value)
  return price
}

/**
 * Format a plain number without currency symbol.
 */
export function formatNumber(value: number | string, locale: string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(num)) return '0'
  return num.toLocaleString(locale === 'bn' ? 'bn-BD' : 'en-US')
}

/**
 * Pick the localised name with fallback: bn→en in Bangla mode, en→bn otherwise.
 */
export function localName(bn: string | null | undefined, en: string | null | undefined, isBn: boolean): string {
  return (isBn ? (bn || en) : (en || bn)) ?? ''
}

/**
 * Format a date string or Date object with the correct locale.
 * Produces Bengali digits and month names in Bangla mode.
 */
export function formatDate(date: string | Date, locale: string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
