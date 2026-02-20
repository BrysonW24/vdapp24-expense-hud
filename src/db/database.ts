import Dexie, { type Table } from 'dexie'
import type { Transaction, Category, ImportBatch, Budget, UserSettings, Goal, Asset, Liability, Property, NetWorthSnapshot } from '@/types'
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
