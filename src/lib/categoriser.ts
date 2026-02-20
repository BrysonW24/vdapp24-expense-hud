import type { Category, CategoryMatch, ParsedRow } from '@/types'

export function categoriseTransaction(row: ParsedRow, categories: Category[]): CategoryMatch {
  const desc = row.description.toLowerCase()
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')
  const transferCategories = categories.filter(c => c.type === 'transfer')

  for (const cat of transferCategories) {
    for (const kw of cat.keywords) {
      if (desc.includes(kw.toLowerCase())) return { row, categoryId: cat.id!, confidence: 'high' }
    }
  }
  if (row.amount > 0) {
    for (const cat of incomeCategories) {
      for (const kw of cat.keywords) {
        if (desc.includes(kw.toLowerCase())) return { row, categoryId: cat.id!, confidence: 'high' }
      }
    }
    const fallback = incomeCategories.find(c => c.name === 'Other Income')
    return { row, categoryId: fallback?.id ?? 0, confidence: 'low' }
  }
  for (const cat of expenseCategories) {
    for (const kw of cat.keywords) {
      if (desc.includes(kw.toLowerCase())) return { row, categoryId: cat.id!, confidence: 'high' }
    }
  }
  const uncategorised = expenseCategories.find(c => c.name === 'Uncategorised')
  return { row, categoryId: uncategorised?.id ?? 0, confidence: 'low' }
}

export function categoriseAll(rows: ParsedRow[], categories: Category[]): CategoryMatch[] {
  return rows.map(row => categoriseTransaction(row, categories))
}
