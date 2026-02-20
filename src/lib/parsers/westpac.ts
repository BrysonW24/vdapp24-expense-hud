import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

export function parseWestpac(csv: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  const rows: ParsedRow[] = []
  for (const row of result.data) {
    const dateStr = row['Date'] ?? row['date'] ?? ''
    const narrative = row['Narrative'] ?? row['Description'] ?? ''
    const debitStr = row['Debit Amount'] ?? row['Debit'] ?? ''
    const creditStr = row['Credit Amount'] ?? row['Credit'] ?? ''
    const balanceStr = row['Balance'] ?? ''
    const date = parse(dateStr.trim(), 'dd/MM/yyyy', new Date())
    if (!isValid(date)) continue
    const debit = debitStr ? parseFloat(debitStr.replace(/[^-\d.]/g, '')) : 0
    const credit = creditStr ? parseFloat(creditStr.replace(/[^-\d.]/g, '')) : 0
    const amount = credit > 0 ? credit : -Math.abs(debit)
    if (debit === 0 && credit === 0) continue
    rows.push({ date, description: narrative.trim(), amount, balance: balanceStr ? parseFloat(balanceStr.replace(/[^-\d.]/g, '')) : undefined })
  }
  return rows
}

export function detectWestpac(csv: string): boolean {
  const h = csv.slice(0, 200).toLowerCase()
  return h.includes('debit amount') || h.includes('credit amount') || (h.includes('narrative') && h.includes('balance'))
}
