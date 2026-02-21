import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Asset } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

export function useAssets(): Asset[] {
  return useLiveQuery(() => db.assets.orderBy('updatedAt').toArray()) ?? []
}

export async function addAsset(asset: Omit<Asset, 'id'>): Promise<number> {
  const id = await db.assets.add({ ...asset, _syncStatus: 'pending', remoteId: null } as Asset)
  bgSync('assets')
  return id
}

export async function updateAsset(id: number, changes: Partial<Asset>): Promise<void> {
  await db.assets.update(id, { ...changes, updatedAt: new Date(), _syncStatus: 'pending' })
  bgSync('assets')
}

export async function deleteAsset(id: number): Promise<void> {
  const record = await db.assets.get(id)
  await db.assets.delete(id)
  bgDelete('assets', record?.remoteId)
}
