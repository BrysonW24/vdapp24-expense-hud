import Papa from 'papaparse'
import { parse, isValid } from 'date-fns'
import type { ParsedRow } from '@/types'

/**
 * Amex CSV parser — handles multiple format versions:
 *
 * Format 4 (current, May 2022+):
 *   Date, Description, Amount, Extended Details, Appears On Your Statement As,
 *   Address, City/State, Zip Code, Country, Reference, Category
 *
 * Format 2:
 *   Date, Description, Category, type, Amount
 *
 * Format 3:
 *   date, ref, amount, payee, memo
 *
 * Format 1:
 *   date, payee, card-holder-name, card-holder-number-end, amount
 *
 * Format 0:
 *   date, ref, payee, card-holder-name, card-number, memo, amount
 *
 * Credit card vs Savings distinction:
 *   - Credit card CSVs: positive amounts = charges (expenses), so we negate them
 *   - Savings/banking CSVs: standard sign convention (negative = debit, positive = credit)
 *
 * Detection heuristic for account type:
 *   - If CSV has "Appears On Your Statement As" or "Card Member" → credit card
 *   - If amounts are overwhelmingly positive with no balance column → credit card
 *   - Otherwise → savings (use amounts as-is)
 */

type AmexFormat = 'v4' | 'v2' | 'v3' | 'v1' | 'v0'

function detectAmexFormat(headers: string[]): AmexFormat {
  const h = headers.map(s => s.toLowerCase().trim())

  // Format 4: has "extended details" or "appears on your statement as"
  if (h.some(c => c.includes('extended details') || c.includes('appears on your statement'))) return 'v4'

  // Format 2: has exactly Date, Description, Category, type, Amount (or similar)
  if (h.includes('type') && h.includes('category') && h.includes('amount')) return 'v2'

  // Format 1: has "card" related columns (card-holder, card member)
  if (h.some(c => c.includes('card'))) return 'v1'

  // Format 3: has ref + payee + memo (no card columns)
  if (h.includes('ref') && (h.includes('payee') || h.includes('memo'))) return 'v3'

  // Format 0: has ref + 7 columns
  if (h.includes('ref') && headers.length >= 6) return 'v0'

  // Fallback to v4 as most common current format
  return 'v4'
}

export function isAmexCreditCard(csv: string): boolean {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true, preview: 1 })
  const headers = result.meta.fields ?? []
  return _isCreditCard(csv, headers)
}

function _isCreditCard(csv: string, headers: string[]): boolean {
  const h = headers.map(s => s.toLowerCase().trim())

  // Explicit credit card indicators
  if (h.some(c => c.includes('appears on your statement') || c.includes('card member') || c.includes('card holder') || c.includes('card-holder'))) {
    return true
  }

  // Check if "type" column exists with credit card indicator values
  if (h.includes('type')) {
    const lower = csv.toLowerCase()
    if (lower.includes('debit') && lower.includes('credit')) return false // savings-style
  }

  // Heuristic: parse a few amount values — if mostly positive, it's a credit card
  // (credit card charges appear as positive in Amex exports)
  const lines = csv.split('\n').slice(1, 20) // skip header, sample first ~19 rows
  let positiveCount = 0
  let totalCount = 0
  for (const line of lines) {
    const parts = line.split(',')
    for (const part of parts) {
      const num = parseFloat(part.replace(/[^-\d.]/g, ''))
      if (!isNaN(num) && Math.abs(num) > 0.01) {
        totalCount++
        if (num > 0) positiveCount++
      }
    }
  }
  // If 80%+ of numeric values are positive → likely credit card
  if (totalCount > 3 && positiveCount / totalCount > 0.8) return true

  return false
}

const DATE_FORMATS = ['dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd', 'dd MMM yyyy', 'dd-MMM-yy']

function parseAmexDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim()
  for (const fmt of DATE_FORMATS) {
    const d = parse(trimmed, fmt, new Date())
    if (isValid(d)) return d
  }
  // Try native Date as last resort
  const native = new Date(trimmed)
  if (isValid(native)) return native
  return null
}

export function parseAmex(csv: string): ParsedRow[] {
  const result = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true })
  if (!result.data.length) return []

  const headers = result.meta.fields ?? Object.keys(result.data[0])
  const format = detectAmexFormat(headers)
  const creditCard = _isCreditCard(csv, headers)

  const rows: ParsedRow[] = []

  for (const row of result.data) {
    let dateStr = ''
    let description = ''
    let amountStr = ''

    switch (format) {
      case 'v4': {
        dateStr = row['Date'] ?? row['date'] ?? ''
        description = row['Description'] ?? row['description'] ?? ''
        amountStr = row['Amount'] ?? row['amount'] ?? ''
        // Enrich with extended details if description is sparse
        const extended = row['Extended Details'] ?? ''
        if (extended && extended.length > description.length) {
          description = extended
        }
        break
      }
      case 'v2': {
        dateStr = row['Date'] ?? row['date'] ?? ''
        description = row['Description'] ?? row['description'] ?? ''
        amountStr = row['Amount'] ?? row['amount'] ?? ''
        break
      }
      case 'v3': {
        dateStr = row['date'] ?? row['Date'] ?? ''
        description = row['payee'] ?? row['Payee'] ?? row['memo'] ?? ''
        amountStr = row['amount'] ?? row['Amount'] ?? ''
        break
      }
      case 'v1': {
        dateStr = row['date'] ?? row['Date'] ?? ''
        description = row['payee'] ?? row['Payee'] ?? row['description'] ?? row['Description'] ?? ''
        amountStr = row['amount'] ?? row['Amount'] ?? ''
        break
      }
      case 'v0': {
        const keys = Object.keys(row)
        dateStr = row[keys[0]] ?? ''
        description = row[keys[2]] ?? '' // payee is 3rd column
        amountStr = row[keys[6]] ?? row[keys[keys.length - 1]] ?? '' // amount is last column
        break
      }
    }

    const date = parseAmexDate(dateStr)
    if (!date) continue

    const rawAmount = parseFloat(amountStr.replace(/[^-\d.]/g, ''))
    if (isNaN(rawAmount) || rawAmount === 0) continue

    // Credit card: positive = charge (expense), so negate to our convention (negative = expense)
    // Savings: amounts are already in standard convention
    const amount = creditCard ? -rawAmount : rawAmount

    rows.push({
      date,
      description: description.trim(),
      amount,
    })
  }

  return rows
}

export function detectAmex(csv: string): boolean {
  const h = csv.slice(0, 500).toLowerCase()

  // Strong signals: Amex-specific column names
  if (h.includes('appears on your statement as')) return true
  if (h.includes('extended details') && h.includes('reference')) return true
  if (h.includes('card member') || h.includes('card-holder-name') || h.includes('card holder')) return true

  // Medium signal: "Date,Description,Amount" with "Reference" or "Category" at end
  if (h.includes('date') && h.includes('description') && h.includes('amount') && h.includes('reference') && h.includes('category')) return true

  return false
}
