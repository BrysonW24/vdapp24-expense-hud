import { createContext, useContext } from 'react'
import type { SyncState } from './useSync'

interface SyncContextValue {
  syncState: SyncState
  lastSynced: Date | null
  runSync: () => Promise<void>
}

export const SyncContext = createContext<SyncContextValue>({
  syncState: 'idle',
  lastSynced: null,
  runSync: async () => {},
})

export function useSyncStatus() {
  return useContext(SyncContext)
}
