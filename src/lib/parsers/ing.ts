import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

export function parseING(csv: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  const rows: ParsedRow[] = []
  for (const row of result.data) {
    const dateStr = row['Date'] ?? row['date'] ?? ''
    const description = row['Description'] ?? row['description'] ?? row['Narrative'] ?? ''
    const debitStr = row['Debit'] ?? row['debit'] ?? ''
    const creditStr = row['Credit'] ?? row['credit'] ?? ''
    const balanceStr = row['Balance'] ?? row['balance'] ?? ''
    const date = parse(dateStr.trim(), 'dd/MM/yyyy', new Date())
    if (!isValid(date)) continue
    const debit = debitStr ? parseFloat(debitStr.replace(/[^-\d.]/g, '')) : NaN
    const credit = creditStr ? parseFloat(creditStr.replace(/[^-\d.]/g, '')) : NaN
    let amount: number
    if (!isNaN(credit) && credit !== 0) {
      amount = credit
    } else if (!isNaN(debit) && debit !== 0) {
      // ING shows debits as negative numbers in the Debit column
      amount = debit < 0 ? debit : -debit
    } else {
      continue
    }
    rows.push({ date, description: description.trim(), amount, balance: balanceStr ? parseFloat(balanceStr.replace(/[^-\d.]/g, '')) : undefined })
  }
  return rows
}

export function detectING(csv: string): boolean {
  const h = csv.slice(0, 200).toLowerCase()
  // ING has Date, Description, Debit, Credit, Balance headers but no bank-specific marker
  // Check for the combination — must have debit AND credit columns (distinguishes from Westpac which uses "Debit Amount")
  return h.includes('date') && h.includes('description') && h.includes('debit') && h.includes('credit') && h.includes('balance')
    && !h.includes('debit amount') && !h.includes('credit amount') && !h.includes('narrative')
}
