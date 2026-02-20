import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { Property } from '@/types'

export function useProperties(): Property[] {
  return useLiveQuery(() => db.properties.toArray()) ?? []
}

export async function addProperty(property: Omit<Property, 'id'>): Promise<number> {
  return db.properties.add(property as Property)
}

export async function updateProperty(id: number, changes: Partial<Property>): Promise<void> {
  await db.properties.update(id, changes)
}

export async function deleteProperty(id: number): Promise<void> {
  return db.properties.delete(id)
}
