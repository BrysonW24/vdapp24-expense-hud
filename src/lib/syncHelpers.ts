import { supabase } from './supabase'
import { syncAfterWrite, queueRemoteDelete, pushAll } from './syncEngine'

/** Get the current user ID, or null if not logged in */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

/** Fire-and-forget sync for a table after a local write */
export function bgSync(dexieTableName: string): void {
  getCurrentUserId().then(userId => {
    if (userId) syncAfterWrite(dexieTableName, userId)
  })
}

/** Queue a remote delete if the record had a remoteId */
export function bgDelete(supabaseTableName: string, remoteId: string | null | undefined): void {
  if (!remoteId) return
  queueRemoteDelete(supabaseTableName, remoteId).then(() => {
    getCurrentUserId().then(userId => {
      if (userId) pushAll(userId)
    })
  })
}
