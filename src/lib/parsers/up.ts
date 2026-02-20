import Papa from 'papaparse'
import { parseISO, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

export function parseUp(csv: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  const rows: ParsedRow[] = []
  for (const row of result.data) {
    const dateStr = row['Date'] ?? row['Time (UTC)'] ?? ''
    const amountStr = row['Amount (AUD)'] ?? row['Total Amount (AUD)'] ?? row['Amount'] ?? ''
    const description = row['Description'] ?? ''
    if (!dateStr || !amountStr) continue
    // Up exports ISO dates (YYYY-MM-DD or full ISO timestamp)
    const date = parseISO(dateStr.trim().slice(0, 10))
    if (!isValid(date)) continue
    const amount = parseFloat(amountStr.replace(/[^-\d.]/g, ''))
    if (isNaN(amount)) continue
    rows.push({ date, description: description.trim(), amount })
  }
  return rows
}

export function detectUp(csv: string): boolean {
  const h = csv.slice(0, 300).toLowerCase()
  return h.includes('time (utc)') || h.includes('amount (aud)') || h.includes('roundup amount')
}
