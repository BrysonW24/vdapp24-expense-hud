import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Category } from '@/types'

export function useCategories() {
  return useLiveQuery(async () => {
    const all = await db.categories.toArray()
    return all.sort((a, b) => a.sortOrder - b.sortOrder)
  }) ?? []
}

export function useCategoryMap() {
  const cats = useCategories()
  return Object.fromEntries(cats.map(c => [c.id!, c])) as Record<number, Category>
}

export async function addCategory(cat: Omit<Category, 'id'>): Promise<number> {
  return db.categories.add(cat as Category)
}

export async function updateCategory(id: number, changes: Partial<Category>): Promise<void> {
  await db.categories.update(id, changes)
}

export async function deleteCategory(id: number): Promise<void> {
  // Move transactions to Uncategorised first
  const uncategorised = await db.categories.where('name').equals('Uncategorised').first()
  if (uncategorised?.id) {
    await db.transactions.where('categoryId').equals(id).modify({ categoryId: uncategorised.id })
  }
  await db.categories.delete(id)
}
