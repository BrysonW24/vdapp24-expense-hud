import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Category } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

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
  const id = await db.categories.add({ ...cat, _syncStatus: 'pending', remoteId: null } as Category)
  bgSync('categories')
  return id
}

export async function updateCategory(id: number, changes: Partial<Category>): Promise<void> {
  await db.categories.update(id, { ...changes, _syncStatus: 'pending' })
  bgSync('categories')
}

export async function deleteCategory(id: number): Promise<void> {
  const record = await db.categories.get(id)
  // Move transactions to Uncategorised first
  const uncategorised = await db.categories.where('name').equals('Uncategorised').first()
  if (uncategorised?.id) {
    await db.transactions.where('categoryId').equals(id).modify({ categoryId: uncategorised.id, _syncStatus: 'pending' })
    bgSync('transactions')
  }
  await db.categories.delete(id)
  bgDelete('categories', record?.remoteId)
}
