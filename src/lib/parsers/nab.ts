import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

export function parseNAB(csv: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  const rows: ParsedRow[] = []
  for (const row of result.data) {
    const dateStr = row['Date'] ?? row['date'] ?? ''
    const amountStr = row['Amount'] ?? row['amount'] ?? ''
    const description = row['Description'] ?? row['description'] ?? row['Narrative'] ?? ''
    const balanceStr = row['Balance'] ?? row['balance'] ?? ''
    let date = parse(dateStr.trim(), 'dd MMM yy', new Date())
    if (!isValid(date)) date = parse(dateStr.trim(), 'dd/MM/yyyy', new Date())
    if (!isValid(date)) continue
    const amount = parseFloat(amountStr.replace(/[^-\d.]/g, ''))
    if (isNaN(amount)) continue
    rows.push({ date, description: description.trim(), amount, balance: balanceStr ? parseFloat(balanceStr.replace(/[^-\d.]/g, '')) : undefined })
  }
  return rows
}

export function detectNAB(csv: string): boolean {
  const h = csv.slice(0, 200).toLowerCase()
  return h.includes('narrative') || (h.includes('date') && h.includes('amount') && h.includes('category'))
}
