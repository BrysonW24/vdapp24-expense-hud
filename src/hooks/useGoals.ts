import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Goal } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

export function useGoals(): Goal[] {
  return useLiveQuery(() => db.goals.orderBy('createdAt').toArray()) ?? []
}

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<number> {
  const id = await db.goals.add({ ...goal, _syncStatus: 'pending', remoteId: null } as Goal)
  bgSync('goals')
  return id
}

export async function deleteGoal(id: number): Promise<void> {
  const record = await db.goals.get(id)
  await db.goals.delete(id)
  bgDelete('goals', record?.remoteId)
}

export async function updateGoal(id: number, changes: Partial<Goal>): Promise<void> {
  await db.goals.update(id, { ...changes, _syncStatus: 'pending' })
  bgSync('goals')
}
