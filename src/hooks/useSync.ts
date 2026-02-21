import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from './useAuth'
import { fullSync } from '@/lib/syncEngine'

export type SyncState = 'idle' | 'syncing' | 'offline' | 'error'

const SYNC_INTERVAL = 60_000 // 60 seconds

export function useSync() {
  const { user } = useAuth()
  const [syncState, setSyncState] = useState<SyncState>('idle')
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const runSync = useCallback(async () => {
    if (!user?.id) return
    if (!navigator.onLine) {
      setSyncState('offline')
      return
    }

    setSyncState('syncing')
    try {
      await fullSync(user.id)
      setLastSynced(new Date())
      setSyncState('idle')
    } catch (err) {
      console.error('[Sync] Full sync failed:', err)
      setSyncState('error')
    }
  }, [user?.id])

  // Initial sync on login + periodic sync
  useEffect(() => {
    if (!user?.id) return

    // Sync immediately on login
    runSync()

    // Then every 60s
    intervalRef.current = setInterval(runSync, SYNC_INTERVAL)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user?.id, runSync])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncState('idle')
      runSync()
    }
    const handleOffline = () => setSyncState('offline')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [runSync])

  return { syncState, lastSynced, runSync }
}
