import { supabase } from './supabase'
import { db } from '@/db/database'
import type { Table } from 'dexie'

// ── Column mapping (Dexie camelCase → Supabase snake_case) ──────────

type ColumnMap = Record<string, string>

const SHARED_MAP: ColumnMap = {
  remoteId: '__skip__',     // internal only
  _syncStatus: '__skip__',  // internal only
}

const TABLE_MAPS: Record<string, ColumnMap> = {
  transactions: {
    ...SHARED_MAP,
    id: '__local_id__',
    categoryId: 'category_id',
    bankAccount: 'bank_account',
    importBatchId: 'import_batch_id',
    isRecurring: 'is_recurring',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  categories: {
    ...SHARED_MAP,
    id: '__local_id__',
    parentId: 'parent_id',
    isDefault: 'is_default',
    sortOrder: 'sort_order',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  import_batches: {
    ...SHARED_MAP,
    id: '__local_id__',
    bankFormat: 'bank_format',
    transactionCount: 'transaction_count',
    dateFrom: 'date_from',
    dateTo: 'date_to',
    importedAt: 'imported_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  budgets: {
    ...SHARED_MAP,
    id: '__local_id__',
    categoryId: 'category_id',
    monthlyLimit: 'monthly_limit',
    effectiveFrom: 'effective_from',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  settings: {
    ...SHARED_MAP,
    id: '__local_id__',
    dateFormat: 'date_format',
    defaultBankFormat: 'default_bank_format',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  goals: {
    ...SHARED_MAP,
    id: '__local_id__',
    targetAmount: 'target_amount',
    categoryId: 'category_id',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  assets: {
    ...SHARED_MAP,
    id: '__local_id__',
    propertyId: 'property_id',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  },
  liabilities: {
    ...SHARED_MAP,
    id: '__local_id__',
    interestRate: 'interest_rate',
    minPayment: 'min_payment',
    propertyId: 'property_id',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
  },
  properties: {
    ...SHARED_MAP,
    id: '__local_id__',
    purchasePrice: 'purchase_price',
    currentValue: 'current_value',
    loanAmount: 'loan_amount',
    interestRate: 'interest_rate',
    loanType: 'loan_type',
    offsetBalance: 'offset_balance',
    weeklyRent: 'weekly_rent',
    vacancyRate: 'vacancy_rate',
    monthlyRunningCosts: 'monthly_running_costs',
    purchaseDate: 'purchase_date',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  net_worth_snapshots: {
    ...SHARED_MAP,
    id: '__local_id__',
    totalAssets: 'total_assets',
    totalLiabilities: 'total_liabilities',
    netWorth: 'net_worth',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
}

// Dexie table name → Supabase table name
const SUPABASE_TABLE: Record<string, string> = {
  transactions: 'transactions',
  categories: 'categories',
  importBatches: 'import_batches',
  budgets: 'budgets',
  settings: 'settings',
  goals: 'goals',
  assets: 'assets',
  liabilities: 'liabilities',
  properties: 'properties',
  netWorthSnapshots: 'net_worth_snapshots',
}

// Sync order respects foreign key deps
const SYNC_ORDER: string[] = [
  'categories',
  'importBatches',
  'properties',
  'transactions',
  'budgets',
  'settings',
  'goals',
  'assets',
  'liabilities',
  'netWorthSnapshots',
]

// ── Helpers ──────────────────────────────────────────────────────────

function toSupabaseRow(dexieTableName: string, record: Record<string, unknown>, userId: string): Record<string, unknown> {
  const supabaseTable = SUPABASE_TABLE[dexieTableName]
  const map = TABLE_MAPS[supabaseTable] ?? SHARED_MAP
  const row: Record<string, unknown> = { user_id: userId }

  for (const [key, value] of Object.entries(record)) {
    const mapped = map[key]
    if (mapped === '__skip__') continue
    if (mapped === '__local_id__') {
      row['local_id'] = value
      continue
    }
    const colName = mapped ?? key // if no mapping, use key as-is
    // Convert Date objects to ISO strings
    row[colName] = value instanceof Date ? value.toISOString() : value
  }

  return row
}

function fromSupabaseRow(supabaseTableName: string, row: Record<string, unknown>): Record<string, unknown> {
  const map = TABLE_MAPS[supabaseTableName] ?? SHARED_MAP
  // Invert the map: snake_case → camelCase
  const inverseMap: Record<string, string> = {}
  for (const [camel, snake] of Object.entries(map)) {
    if (snake === '__skip__') continue
    if (snake === '__local_id__') {
      inverseMap['local_id'] = 'id' // don't overwrite — we'll handle separately
      continue
    }
    inverseMap[snake] = camel
  }

  const result: Record<string, unknown> = {
    remoteId: row['id'],
    _syncStatus: 'synced' as const,
  }

  for (const [key, value] of Object.entries(row)) {
    if (key === 'id' || key === 'user_id') continue
    if (key === 'local_id') {
      // Preserve local_id → id mapping if present
      if (value != null) result['id'] = value
      continue
    }
    const camelKey = inverseMap[key] ?? key
    result[camelKey] = value
  }

  // Convert date strings back to Date objects for common date fields
  const dateFields = ['date', 'createdAt', 'updatedAt', 'importedAt', 'dateFrom', 'dateTo', 'effectiveFrom', 'deadline', 'purchaseDate']
  for (const field of dateFields) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = new Date(result[field] as string)
    }
  }

  return result
}

// ── Push: Local pending → Supabase ──────────────────────────────────

async function pushTable(dexieTableName: string, userId: string): Promise<number> {
  const dexieTable = (db as unknown as Record<string, Table>)[dexieTableName]
  if (!dexieTable) return 0

  const pending = await dexieTable.where('_syncStatus').equals('pending').toArray()
  if (pending.length === 0) return 0

  const supabaseTable = SUPABASE_TABLE[dexieTableName]
  let pushed = 0

  for (const record of pending) {
    const row = toSupabaseRow(dexieTableName, record as Record<string, unknown>, userId)

    if (record.remoteId) {
      // Update existing remote record
      const { error } = await supabase
        .from(supabaseTable)
        .update(row)
        .eq('id', record.remoteId)
        .eq('user_id', userId)

      if (error) {
        console.error(`[Sync] Push update ${supabaseTable}:`, error.message)
        continue
      }
    } else {
      // Insert new remote record
      const { data, error } = await supabase
        .from(supabaseTable)
        .insert(row)
        .select('id')
        .single()

      if (error) {
        console.error(`[Sync] Push insert ${supabaseTable}:`, error.message)
        continue
      }

      // Store the remote UUID back into Dexie
      await dexieTable.update(record.id, { remoteId: data.id })
    }

    await dexieTable.update(record.id, { _syncStatus: 'synced' })
    pushed++
  }

  return pushed
}

// ── Pull: Supabase → local Dexie ────────────────────────────────────

async function pullTable(dexieTableName: string, _userId: string): Promise<number> {
  const dexieTable = (db as unknown as Record<string, Table>)[dexieTableName]
  if (!dexieTable) return 0

  const supabaseTable = SUPABASE_TABLE[dexieTableName]

  const { data: remoteRows, error } = await supabase
    .from(supabaseTable)
    .select('*')

  if (error) {
    console.error(`[Sync] Pull ${supabaseTable}:`, error.message)
    return 0
  }

  if (!remoteRows || remoteRows.length === 0) return 0

  let pulled = 0

  for (const remoteRow of remoteRows) {
    const remoteId = remoteRow.id as string

    // Check if we already have this record locally
    const existing = await dexieTable.where('remoteId').equals(remoteId).first()

    if (existing) {
      // Skip if local record is pending (local wins during push)
      if (existing._syncStatus === 'pending') continue

      // Last-write-wins: compare updated_at
      const remoteUpdated = new Date(remoteRow.updated_at || remoteRow.created_at || 0)
      const localUpdated = existing.updatedAt instanceof Date ? existing.updatedAt : new Date(existing.updatedAt || 0)

      if (remoteUpdated > localUpdated) {
        const localRecord = fromSupabaseRow(supabaseTable, remoteRow)
        localRecord['id'] = existing.id // keep local ID
        await dexieTable.update(existing.id, localRecord)
        pulled++
      }
    } else {
      // New remote record — insert locally
      const localRecord = fromSupabaseRow(supabaseTable, remoteRow)
      // Remove auto-increment id so Dexie assigns one
      delete localRecord['id']
      await dexieTable.add(localRecord)
      pulled++
    }
  }

  return pulled
}

// ── Flush delete queue ──────────────────────────────────────────────

async function flushDeletes(userId: string): Promise<number> {
  const queue = await db._deleteQueue.toArray()
  if (queue.length === 0) return 0

  let flushed = 0

  for (const entry of queue) {
    const { error } = await supabase
      .from(entry.tableName)
      .delete()
      .eq('id', entry.remoteId)
      .eq('user_id', userId)

    if (error) {
      console.error(`[Sync] Delete ${entry.tableName}/${entry.remoteId}:`, error.message)
      continue
    }

    await db._deleteQueue.delete(entry.id!)
    flushed++
  }

  return flushed
}

// ── Public API ──────────────────────────────────────────────────────

export async function pushAll(userId: string): Promise<number> {
  let total = 0
  for (const table of SYNC_ORDER) {
    total += await pushTable(table, userId)
  }
  total += await flushDeletes(userId)
  return total
}

export async function pullAll(userId: string): Promise<number> {
  let total = 0
  for (const table of SYNC_ORDER) {
    total += await pullTable(table, userId)
  }
  return total
}

export async function fullSync(userId: string): Promise<{ pushed: number; pulled: number }> {
  const pushed = await pushAll(userId)
  const pulled = await pullAll(userId)
  return { pushed, pulled }
}

/** Push a single table after a write — call fire-and-forget */
export async function syncAfterWrite(dexieTableName: string, userId: string): Promise<void> {
  try {
    await pushTable(dexieTableName, userId)
  } catch (err) {
    console.warn(`[Sync] Background push failed for ${dexieTableName}:`, err)
  }
}

/** Queue a remote delete (call before or after local Dexie delete) */
export async function queueRemoteDelete(supabaseTableName: string, remoteId: string): Promise<void> {
  await db._deleteQueue.add({
    tableName: supabaseTableName,
    remoteId,
    deletedAt: new Date(),
  })
}
