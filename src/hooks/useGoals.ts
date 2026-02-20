import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Goal } from '@/types'

export function useGoals(): Goal[] {
  return useLiveQuery(() => db.goals.orderBy('createdAt').toArray()) ?? []
}

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<number> {
  return db.goals.add(goal as Goal)
}

export async function deleteGoal(id: number): Promise<void> {
  return db.goals.delete(id)
}

export async function updateGoal(id: number, changes: Partial<Goal>): Promise<void> {
  await db.goals.update(id, changes)
}
