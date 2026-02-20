export interface MockTransaction {
  date: string
  merchant: string
  category: string
  amount: number
  type: 'planned' | 'necessary' | 'emotional' | 'opportunistic'
}

export interface MockMerchant {
  name: string
  category: string
  totalSpend: number
  txCount: number
  color: string
  monthlySpend: number[]
}

export interface MockMonthly {
  month: string
  label: string
  income: number
  expenses: number
  savings: number
  mood: number // 0-100
}

export interface MockSubscription {
  name: string
  cost: number
  frequency: 'monthly' | 'yearly'
  category: string
  used: boolean
}

export interface MockCashFlowLink {
  source: string
  target: string
  value: number
}

export interface MockMomentum {
  category: string
  change: number // % MoM
  current: number
  previous: number
}

export interface MockLifestyleDrift {
  year: number
  baseline: number
  actual: number
}

export interface MockNetworkNode {
  id: string
  label: string
  group: 'you' | 'merchant' | 'category' | 'location'
  value: number
}

export interface MockNetworkLink {
  source: string
  target: string
  value: number
}

export interface MockProjection {
  month: number
  label: string
  current: number
  optimized: number
}

export interface MockDailySpend {
  date: string
  amount: number
}

export interface MockDNA {
  month: string
  categories: Record<string, number>
}
