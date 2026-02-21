import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Property } from '@/types'
import { bgSync, bgDelete } from '@/lib/syncHelpers'

export function useProperties(): Property[] {
  return useLiveQuery(() => db.properties.toArray()) ?? []
}

export async function addProperty(property: Omit<Property, 'id'>): Promise<number> {
  const id = await db.properties.add({ ...property, _syncStatus: 'pending', remoteId: null } as Property)
  bgSync('properties')
  return id
}

export async function updateProperty(id: number, changes: Partial<Property>): Promise<void> {
  await db.properties.update(id, { ...changes, _syncStatus: 'pending' })
  bgSync('properties')
}

export async function deleteProperty(id: number): Promise<void> {
  const record = await db.properties.get(id)
  await db.properties.delete(id)
  bgDelete('properties', record?.remoteId)
}
