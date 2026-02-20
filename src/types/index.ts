export interface Transaction {
  id?: number
  date: Date
  description: string
  amount: number
  balance?: number
  categoryId: number
  bankAccount: string
  importBatchId: number
  notes?: string
  isRecurring?: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id?: number
  name: string
  icon: string
  color: string
  type: 'expense' | 'income' | 'transfer'
  parentId?: number
  keywords: string[]
  budget?: number
  isDefault: boolean
  sortOrder: number
}

export interface ImportBatch {
  id?: number
  filename: string
  bankFormat: BankFormat
  transactionCount: number
  dateFrom: Date
  dateTo: Date
  importedAt: Date
}

export interface Budget {
  id?: number
  categoryId: number
  monthlyLimit: number
  effectiveFrom: Date
}

export interface UserSettings {
  id?: number
  currency: string
  dateFormat: string
  defaultBankFormat: BankFormat
  theme: 'light' | 'dark' | 'system'
}

export type BankFormat = 'commbank' | 'nab' | 'anz' | 'westpac' | 'up' | 'ing' | 'generic'

export interface ParsedRow {
  date: Date
  description: string
  amount: number
  balance?: number
}

export interface ParseResult {
  rows: ParsedRow[]
  format: BankFormat
  errors: string[]
}

export interface CategoryMatch {
  row: ParsedRow
  categoryId: number
  confidence: 'high' | 'medium' | 'low'
}

export interface MonthlyBreakdown {
  month: string
  income: number
  expenses: number
  net: number
  byCategory: Record<number, number>
}

export interface SpendingInsight {
  type: 'warning' | 'info' | 'positive'
  title: string
  description: string
  headline?: string
  headlineSub?: string
  value?: number
  categoryId?: number
}

export interface Goal {
  id?: number
  type: 'save' | 'spend_limit' | 'category_limit' | 'income_target'
  title: string
  targetAmount: number
  categoryId?: number
  deadline?: Date
  createdAt: Date
}

export interface GoalProgress {
  current: number
  target: number
  pct: number
  onTrack: boolean
  coaching: string
}

// Wealth module types

export type AssetType = 'cash' | 'offset' | 'shares' | 'super' | 'property' | 'crypto' | 'business' | 'other'
export type LiabilityType = 'mortgage' | 'hecs' | 'personal_loan' | 'car_loan' | 'credit_card' | 'other'
export type LoanType = 'io' | 'p&i'

export interface Asset {
  id?: number
  name: string
  type: AssetType
  value: number
  notes?: string
  propertyId?: number  // linked from Properties page
  updatedAt: Date
}

export interface Liability {
  id?: number
  name: string
  type: LiabilityType
  balance: number
  interestRate?: number  // annual %
  minPayment?: number    // monthly
  notes?: string
  propertyId?: number    // linked from Properties page
  updatedAt: Date
}

export interface Property {
  id?: number
  nickname: string
  address?: string
  purchasePrice: number
  currentValue: number
  loanAmount: number
  interestRate: number   // annual %
  loanType: LoanType
  offsetBalance: number
  weeklyRent: number
  vacancyRate: number    // % (e.g. 5 = 5%)
  monthlyRunningCosts: number
  purchaseDate?: Date
  notes?: string
}

export interface NetWorthSnapshot {
  id?: number
  date: Date             // stored as YYYY-MM-01 (first of month)
  totalAssets: number
  totalLiabilities: number
  netWorth: number
}

// Agent alert
export interface AgentAlert {
  id: string
  type: 'warning' | 'info' | 'positive'
  message: string
}
