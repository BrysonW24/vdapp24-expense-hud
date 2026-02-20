import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

export function parseCommBank(csv: string): ParsedRow[] {
  const result = Papa.parse<string[]>(csv, { skipEmptyLines: true })
  const rows: ParsedRow[] = []
  for (const row of result.data) {
    if (row.length < 3) continue
    const [dateStr, amountStr, description, balanceStr] = row
    if (!dateStr || dateStr.toLowerCase() === 'date') continue
    const date = parse(dateStr.trim(), 'dd/MM/yyyy', new Date())
    if (!isValid(date)) continue
    const amount = parseFloat(amountStr.replace(/[^-\d.]/g, ''))
    if (isNaN(amount)) continue
    rows.push({ date, description: description?.trim() ?? '', amount, balance: balanceStr ? parseFloat(balanceStr.replace(/[^-\d.]/g, '')) : undefined })
  }
  return rows
}

export function detectCommBank(csv: string): boolean {
  return /^\d{2}\/\d{2}\/\d{4},-?\d/.test(csv.trim())
}
