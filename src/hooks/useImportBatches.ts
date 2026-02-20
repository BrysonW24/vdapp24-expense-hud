import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/database'
import type { ImportBatch } from '@/types'

export function useImportBatches() {
  return useLiveQuery(() => db.importBatches.orderBy('importedAt').reverse().toArray()) ?? []
}

export async function addImportBatch(batch: Omit<ImportBatch, 'id'>): Promise<number> {
  return db.importBatches.add(batch as ImportBatch)
}
