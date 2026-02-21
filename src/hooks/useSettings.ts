import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { UserSettings } from '@/types'
import { bgSync } from '@/lib/syncHelpers'

export function useSettings(): UserSettings | undefined {
  return useLiveQuery(() => db.settings.toCollection().first())
}

export async function updateSettings(changes: Partial<UserSettings>): Promise<void> {
  const settings = await db.settings.toCollection().first()
  if (settings?.id) {
    await db.settings.update(settings.id, { ...changes, _syncStatus: 'pending' })
    bgSync('settings')
  }
}
