import Dexie, { type Table } from 'dexie'
import type { Transaction, Category, ImportBatch, Budget, UserSettings, Goal, Asset, Liability, Property, NetWorthSnapshot, DeleteQueueEntry } from '@/types'
import { defaultCategories, defaultSettings } from './seeds'

export class ExpenseDatabase extends Dexie {
  transactions!: Table<Transaction>
  categories!: Table<Category>
  importBatches!: Table<ImportBatch>
  budgets!: Table<Budget>
  settings!: Table<UserSettings>
  goals!: Table<Goal>
  assets!: Table<Asset>
  liabilities!: Table<Liability>
  properties!: Table<Property>
  netWorthSnapshots!: Table<NetWorthSnapshot>
  _deleteQueue!: Table<DeleteQueueEntry>

  constructor() {
    super('expense-hud')
    this.version(2).stores({
      transactions: '++id, date, categoryId, importBatchId, bankAccount, amount',
      categories: '++id, type, name',
      importBatches: '++id, importedAt',
      budgets: '++id, categoryId',
      settings: '++id',
    })
    this.version(3).stores({
      transactions: '++id, date, categoryId, importBatchId, bankAccount, amount',
      categories: '++id, type, name',
      importBatches: '++id, importedAt',
      budgets: '++id, categoryId',
      settings: '++id',
      goals: '++id, type, createdAt',
    })
    this.version(4).stores({
      transactions: '++id, date, categoryId, importBatchId, bankAccount, amount',
      categories: '++id, type, name',
      importBatches: '++id, importedAt',
      budgets: '++id, categoryId',
      settings: '++id',
      goals: '++id, type, createdAt',
      assets: '++id, type, updatedAt',
      liabilities: '++id, type, updatedAt',
      properties: '++id',
      netWorthSnapshots: '++id, date',
    })
    this.version(5).stores({
      transactions: '++id, date, categoryId, importBatchId, bankAccount, amount, remoteId, _syncStatus',
      categories: '++id, type, name, remoteId, _syncStatus',
      importBatches: '++id, importedAt, remoteId, _syncStatus',
      budgets: '++id, categoryId, remoteId, _syncStatus',
      settings: '++id, remoteId, _syncStatus',
      goals: '++id, type, createdAt, remoteId, _syncStatus',
      assets: '++id, type, updatedAt, remoteId, _syncStatus',
      liabilities: '++id, type, updatedAt, remoteId, _syncStatus',
      properties: '++id, remoteId, _syncStatus',
      netWorthSnapshots: '++id, date, remoteId, _syncStatus',
      _deleteQueue: '++id, tableName',
    }).upgrade(tx => {
      // Mark all existing records as pending sync
      const tables = ['transactions', 'categories', 'importBatches', 'budgets', 'settings', 'goals', 'assets', 'liabilities', 'properties', 'netWorthSnapshots'] as const
      return Promise.all(
        tables.map(table =>
          (tx as unknown as Record<string, Table>)[table]
            .toCollection()
            .modify({ _syncStatus: 'pending', remoteId: null })
        )
      )
    })
  }
}

export const db = new ExpenseDatabase()

// Seed on first open
db.on('ready', async () => {
  const count = await db.categories.count()
  if (count === 0) {
    await db.categories.bulkAdd(defaultCategories as Category[])
  }
  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add(defaultSettings as UserSettings)
  }
})
