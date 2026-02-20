import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Asset } from '@/types'

export function useAssets(): Asset[] {
  return useLiveQuery(() => db.assets.orderBy('updatedAt').toArray()) ?? []
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<number> {
  return db.assets.add(asset as Asset)
}

export async function updateAsset(id: number, changes: Partial<Asset>): Promise<void> {
  await db.assets.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteAsset(id: number): Promise<void> {
  return db.assets.delete(id)
}
