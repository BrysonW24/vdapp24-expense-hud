import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Transaction } from '@/types'

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
  return db.transactions.add(tx as Transaction)
}

export async function updateTransaction(id: number, changes: Partial<Transaction>): Promise<void> {
  await db.transactions.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteTransaction(id: number): Promise<void> {
  await db.transactions.delete(id)
}

export async function bulkAddTransactions(txs: Omit<Transaction, 'id'>[]): Promise<void> {
  await db.transactions.bulkAdd(txs as Transaction[])
}
