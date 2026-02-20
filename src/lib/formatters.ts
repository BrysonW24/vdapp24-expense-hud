import { format } from 'date-fns'

export function formatCurrency(amount: number, currency = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Math.abs(amount))
}

export function formatDate(date: Date | string, fmt = 'dd MMM yyyy'): string {
  return format(new Date(date), fmt)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatShortCurrency(amount: number): string {
  const abs = Math.abs(amount)
  if (abs >= 1000) return `$${(abs / 1000).toFixed(1)}k`
  return `$${abs.toFixed(0)}`
}
