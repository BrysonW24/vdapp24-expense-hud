import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Liability } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

export function useLiabilities(): Liability[] {
  return useLiveQuery(() => db.liabilities.orderBy('updatedAt').toArray()) ?? []
}

export async function addLiability(liability: Omit<Liability, 'id'>): Promise<number> {
  const id = await db.liabilities.add({ ...liability, _syncStatus: 'pending', remoteId: null } as Liability)
  bgSync('liabilities')
  return id
}

export async function updateLiability(id: number, changes: Partial<Liability>): Promise<void> {
  await db.liabilities.update(id, { ...changes, updatedAt: new Date(), _syncStatus: 'pending' })
  bgSync('liabilities')
}

export async function deleteLiability(id: number): Promise<void> {
  const record = await db.liabilities.get(id)
  await db.liabilities.delete(id)
  bgDelete('liabilities', record?.remoteId)
}
