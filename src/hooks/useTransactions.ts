import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Transaction } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

export function useTransactions(filters?: { categoryId?: number; search?: string; bankAccount?: string }) {
  return useLiveQuery(async () => {
    const all = await db.transactions.orderBy('date').reverse().toArray()
    return all.filter(tx => {
      if (filters?.categoryId && tx.categoryId !== filters.categoryId) return false
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        if (!tx.description.toLowerCase().includes(q)) return false
      }
      if (filters?.bankAccount && tx.bankAccount !== filters.bankAccount) return false
      return true
    })
  }, [filters?.categoryId, filters?.search, filters?.bankAccount]) ?? []
}

export function useAllTransactions() {
  return useLiveQuery(() =>
    db.transactions.orderBy('date').reverse().toArray()
  ) ?? []
}

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<number> {
  const id = await db.transactions.add({ ...tx, _syncStatus: 'pending', remoteId: null } as Transaction)
  bgSync('transactions')
  return id
}

export async function updateTransaction(id: number, changes: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, { ...changes, updatedAt: new Date(), _syncStatus: 'pending' })
  bgSync('transactions')
}

export async function deleteTransaction(id: number): Promise<void> {
  const record = await db.transactions.get(id)
  await db.transactions.delete(id)
  bgDelete('transactions', record?.remoteId)
}

export async function bulkAddTransactions(txs: Omit<Transaction, 'id'>[]): Promise<void> {
  const withSync = txs.map(tx => ({ ...tx, _syncStatus: 'pending' as const, remoteId: null }))
  await db.transactions.bulkAdd(withSync as Transaction[])
  bgSync('transactions')
}
