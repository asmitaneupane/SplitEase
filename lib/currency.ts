export const CURRENCIES = [
  { code: 'NPR', symbol: 'Rs.', name: 'Nepalese Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
] as const

export type CurrencyCode = (typeof CURRENCIES)[number]['code']

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find((c) => c.code === code)
  return currency?.symbol ?? code
}

export function formatCurrency(amount: number, currency: string = 'NPR'): string {
  const symbol = getCurrencySymbol(currency)
  const formattedAmount = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  if (amount < 0) {
    return `-${symbol}${formattedAmount}`
  }
  return `${symbol}${formattedAmount}`
}

export function formatCompactCurrency(amount: number, currency: string = 'NPR'): string {
  const symbol = getCurrencySymbol(currency)
  const absAmount = Math.abs(amount)
  
  let formattedAmount: string
  if (absAmount >= 10000000) {
    formattedAmount = (absAmount / 10000000).toFixed(1) + 'Cr'
  } else if (absAmount >= 100000) {
    formattedAmount = (absAmount / 100000).toFixed(1) + 'L'
  } else if (absAmount >= 1000) {
    formattedAmount = (absAmount / 1000).toFixed(1) + 'K'
  } else {
    formattedAmount = absAmount.toFixed(2)
  }
  
  if (amount < 0) {
    return `-${symbol}${formattedAmount}`
  }
  return `${symbol}${formattedAmount}`
}
