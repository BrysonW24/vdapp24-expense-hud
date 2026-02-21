import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { ImportBatch } from '@/types'
import { bgSync } from '@/lib/syncHelpers'

export function useImportBatches() {
  return useLiveQuery(() => db.importBatches.orderBy('importedAt').reverse().toArray()) ?? []
}

export async function addImportBatch(batch: Omit<ImportBatch, 'id'>): Promise<number> {
  const id = await db.importBatches.add({ ...batch, _syncStatus: 'pending', remoteId: null } as ImportBatch)
  bgSync('importBatches')
  return id
}
