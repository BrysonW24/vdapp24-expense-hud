import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { NetWorthSnapshot } from '@/types'

export function useNetWorthSnapshots(): NetWorthSnapshot[] {
  return useLiveQuery(() => db.netWorthSnapshots.orderBy('date').toArray()) ?? []
}

export async function saveSnapshot(totalAssets: number, totalLiabilities: number): Promise<void> {
  const now = new Date()
  // Use first of current month as the key
  const monthKey = new Date(now.getFullYear(), now.getMonth(), 1)

  const existing = await db.netWorthSnapshots
    .where('date')
    .equals(monthKey)
    .first()

  const snapshot: NetWorthSnapshot = {
    date: monthKey,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  }

  if (existing?.id) {
    await db.netWorthSnapshots.update(existing.id, snapshot)
  } else {
    await db.netWorthSnapshots.add(snapshot)
  }
}
