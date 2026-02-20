import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Liability } from '@/types'

export function useLiabilities(): Liability[] {
  return useLiveQuery(() => db.liabilities.orderBy('updatedAt').toArray()) ?? []
}

export async function addLiability(liability: Omit<Liability, 'id'>): Promise<number> {
  return db.liabilities.add(liability as Liability)
}

export async function updateLiability(id: number, changes: Partial<Liability>): Promise<void> {
  await db.liabilities.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteLiability(id: number): Promise<void> {
  return db.liabilities.delete(id)
}
