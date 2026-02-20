import type { BankFormat, ParseResult } from '@/types'
import { parseCommBank, detectCommBank } from './commbank'
import { parseNAB, detectNAB } from './nab'
import { parseANZ, detectANZ } from './anz'
import { parseWestpac, detectWestpac } from './westpac'
import { parseUp, detectUp } from './up'
import { parseING, detectING } from './ing'

export function detectFormat(csv: string): BankFormat {
  if (detectUp(csv)) return 'up'
  if (detectWestpac(csv)) return 'westpac'
  if (detectNAB(csv)) return 'nab'
  if (detectING(csv)) return 'ing'
  if (detectANZ(csv)) return 'anz'
  if (detectCommBank(csv)) return 'commbank'
  return 'generic'
}

export function parseCSV(csv: string, format?: BankFormat): ParseResult {
  const detectedFormat = format ?? detectFormat(csv)
  const errors: string[] = []
  try {
    let rows = []
    switch (detectedFormat) {
      case 'commbank': rows = parseCommBank(csv); break
      case 'nab': rows = parseNAB(csv); break
      case 'anz': rows = parseANZ(csv); break
      case 'westpac': rows = parseWestpac(csv); break
      case 'up': rows = parseUp(csv); break
      case 'ing': rows = parseING(csv); break
      default: rows = parseCommBank(csv); break
    }
    if (rows.length === 0) errors.push('No transactions parsed. Check the file format.')
    return { rows, format: detectedFormat, errors }
  } catch (err) {
    errors.push(`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    return { rows: [], format: detectedFormat, errors }
  }
}

export const FORMAT_LABELS: Record<BankFormat, string> = {
  commbank: 'Commonwealth Bank',
  nab: 'NAB',
  anz: 'ANZ',
  westpac: 'Westpac',
  up: 'Up Bank',
  ing: 'ING',
  generic: 'Generic CSV',
}
