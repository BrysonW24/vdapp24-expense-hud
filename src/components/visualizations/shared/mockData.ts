import type {
  MockTransaction, MockMerchant, MockMonthly, MockSubscription,
  MockCashFlowLink, MockMomentum, MockLifestyleDrift,
  MockNetworkNode, MockNetworkLink, MockProjection, MockDailySpend, MockDNA,
} from './types'

// ─── Merchants ───────────────────────────────────────────────
export const MOCK_MERCHANTS: MockMerchant[] = [
  { name: 'Woolworths',    category: 'Groceries',      totalSpend: 6840,  txCount: 96,  color: '#10b981', monthlySpend: [520, 540, 580, 560, 600, 620, 580, 560, 540, 580, 600, 560] },
  { name: 'Coles',         category: 'Groceries',      totalSpend: 3960,  txCount: 52,  color: '#ef4444', monthlySpend: [300, 320, 340, 330, 350, 360, 330, 320, 310, 340, 350, 310] },
  { name: 'Uber Eats',     category: 'Eating Out',     totalSpend: 2880,  txCount: 72,  color: '#22c55e', monthlySpend: [200, 220, 280, 250, 240, 260, 230, 240, 260, 220, 240, 240] },
  { name: 'BWS',           category: 'Alcohol',        totalSpend: 1440,  txCount: 36,  color: '#a855f7', monthlySpend: [100, 110, 120, 130, 110, 120, 130, 120, 110, 130, 120, 140] },
  { name: 'Bunnings',      category: 'Home',           totalSpend: 1860,  txCount: 18,  color: '#16a34a', monthlySpend: [80, 120, 200, 150, 180, 160, 140, 160, 180, 120, 190, 180] },
  { name: 'JB Hi-Fi',      category: 'Electronics',    totalSpend: 2400,  txCount: 8,   color: '#eab308', monthlySpend: [0, 0, 400, 0, 200, 0, 0, 600, 0, 0, 800, 400] },
  { name: 'Ampol',         category: 'Transport',      totalSpend: 2640,  txCount: 48,  color: '#3b82f6', monthlySpend: [200, 210, 220, 230, 220, 210, 200, 230, 240, 220, 230, 230] },
  { name: 'Kmart',         category: 'Shopping',       totalSpend: 960,   txCount: 12,  color: '#ec4899', monthlySpend: [60, 40, 80, 100, 60, 80, 100, 60, 80, 120, 80, 100] },
  { name: 'Chemist Warehouse', category: 'Health',     totalSpend: 720,   txCount: 24,  color: '#06b6d4', monthlySpend: [50, 60, 70, 50, 60, 70, 50, 60, 70, 50, 60, 70] },
  { name: 'Dan Murphy\'s', category: 'Alcohol',        totalSpend: 840,   txCount: 12,  color: '#f97316', monthlySpend: [50, 60, 80, 70, 60, 80, 70, 60, 80, 70, 80, 80] },
  { name: 'Officeworks',   category: 'Office',         totalSpend: 540,   txCount: 6,   color: '#64748b', monthlySpend: [0, 90, 0, 0, 180, 0, 0, 90, 0, 0, 180, 0] },
  { name: 'Menulog',       category: 'Eating Out',     totalSpend: 1200,  txCount: 30,  color: '#fb923c', monthlySpend: [80, 100, 120, 100, 80, 100, 120, 100, 80, 100, 120, 100] },
  { name: 'Aldi',          category: 'Groceries',      totalSpend: 2160,  txCount: 48,  color: '#0ea5e9', monthlySpend: [160, 170, 180, 190, 180, 170, 180, 190, 180, 170, 180, 190] },
  { name: 'Target',        category: 'Shopping',       totalSpend: 720,   txCount: 8,   color: '#e11d48', monthlySpend: [0, 60, 0, 120, 0, 60, 0, 120, 0, 60, 0, 300] },
  { name: 'Flight Centre', category: 'Travel',         totalSpend: 4200,  txCount: 4,   color: '#8b5cf6', monthlySpend: [0, 0, 0, 0, 0, 2100, 0, 0, 0, 0, 0, 2100] },
]

// ─── Monthly Summary ─────────────────────────────────────────
export const MOCK_MONTHLY: MockMonthly[] = [
  { month: '2024-10', label: 'Oct 24', income: 7800, expenses: 4800, savings: 3000, mood: 75 },
  { month: '2024-11', label: 'Nov 24', income: 7800, expenses: 5200, savings: 2600, mood: 65 },
  { month: '2024-12', label: 'Dec 24', income: 7800, expenses: 6800, savings: 1000, mood: 45 },
  { month: '2025-01', label: 'Jan 25', income: 7800, expenses: 5600, savings: 2200, mood: 55 },
  { month: '2025-02', label: 'Feb 25', income: 7800, expenses: 4600, savings: 3200, mood: 78 },
  { month: '2025-03', label: 'Mar 25', income: 7800, expenses: 4400, savings: 3400, mood: 82 },
  { month: '2025-04', label: 'Apr 25', income: 7800, expenses: 4900, savings: 2900, mood: 70 },
  { month: '2025-05', label: 'May 25', income: 7800, expenses: 5100, savings: 2700, mood: 62 },
  { month: '2025-06', label: 'Jun 25', income: 7800, expenses: 5400, savings: 2400, mood: 58 },
  { month: '2025-07', label: 'Jul 25', income: 7800, expenses: 4700, savings: 3100, mood: 72 },
  { month: '2025-08', label: 'Aug 25', income: 7800, expenses: 5000, savings: 2800, mood: 68 },
  { month: '2025-09', label: 'Sep 25', income: 7800, expenses: 4500, savings: 3300, mood: 80 },
]

// ─── Subscriptions ───────────────────────────────────────────
export const MOCK_SUBSCRIPTIONS: MockSubscription[] = [
  { name: 'Netflix',        cost: 22.99,  frequency: 'monthly', category: 'Entertainment', used: true },
  { name: 'Spotify',        cost: 12.99,  frequency: 'monthly', category: 'Entertainment', used: true },
  { name: 'ChatGPT Plus',   cost: 30.00,  frequency: 'monthly', category: 'Productivity',  used: true },
  { name: 'Kayo Sports',    cost: 27.99,  frequency: 'monthly', category: 'Entertainment', used: false },
  { name: 'Anytime Fitness', cost: 69.90, frequency: 'monthly', category: 'Health',        used: true },
  { name: 'iCloud+',        cost: 4.49,   frequency: 'monthly', category: 'Tech',          used: true },
  { name: 'YouTube Premium', cost: 16.99, frequency: 'monthly', category: 'Entertainment', used: false },
  { name: 'RACQ',           cost: 840,    frequency: 'yearly',  category: 'Insurance',     used: true },
]

// ─── Cash Flow (Sankey links) ────────────────────────────────
export const MOCK_CASH_FLOW: MockCashFlowLink[] = [
  // Income sources
  { source: 'Salary',      target: 'Total Income',    value: 7800 },
  // Income to categories
  { source: 'Total Income', target: 'Housing',        value: 1800 },
  { source: 'Total Income', target: 'Groceries',      value: 1100 },
  { source: 'Total Income', target: 'Transport',      value: 450 },
  { source: 'Total Income', target: 'Eating Out',     value: 380 },
  { source: 'Total Income', target: 'Entertainment',  value: 200 },
  { source: 'Total Income', target: 'Shopping',       value: 180 },
  { source: 'Total Income', target: 'Health',         value: 130 },
  { source: 'Total Income', target: 'Utilities',      value: 280 },
  { source: 'Total Income', target: 'Insurance',      value: 160 },
  { source: 'Total Income', target: 'Subscriptions',  value: 185 },
  { source: 'Total Income', target: 'Savings',        value: 2935 },
  // Savings breakdown
  { source: 'Savings',     target: 'Emergency Fund',  value: 1000 },
  { source: 'Savings',     target: 'ETF Investment',  value: 1500 },
  { source: 'Savings',     target: 'Travel Fund',     value: 435 },
]

// ─── Momentum ────────────────────────────────────────────────
export const MOCK_MOMENTUM: MockMomentum[] = [
  { category: 'Groceries',     change: 4.2,   current: 1100, previous: 1056 },
  { category: 'Eating Out',    change: 18.5,  current: 380,  previous: 321 },
  { category: 'Transport',     change: -2.1,  current: 450,  previous: 460 },
  { category: 'Entertainment', change: 12.3,  current: 200,  previous: 178 },
  { category: 'Shopping',      change: -15.0, current: 180,  previous: 212 },
  { category: 'Health',        change: 0,     current: 130,  previous: 130 },
  { category: 'Utilities',     change: 8.5,   current: 280,  previous: 258 },
  { category: 'Housing',       change: 0,     current: 1800, previous: 1800 },
]

// ─── Lifestyle Drift ─────────────────────────────────────────
export const MOCK_LIFESTYLE_DRIFT: MockLifestyleDrift[] = [
  { year: 2022, baseline: 3800, actual: 3900 },
  { year: 2023, baseline: 3950, actual: 4200 },
  { year: 2024, baseline: 4100, actual: 4650 },
  { year: 2025, baseline: 4250, actual: 5000 },
]

// ─── Network Graph ───────────────────────────────────────────
export const MOCK_NETWORK_NODES: MockNetworkNode[] = [
  { id: 'you',     label: 'You',             group: 'you',      value: 7800 },
  { id: 'woolies', label: 'Woolworths',       group: 'merchant', value: 570 },
  { id: 'coles',   label: 'Coles',           group: 'merchant', value: 330 },
  { id: 'uber',    label: 'Uber Eats',       group: 'merchant', value: 240 },
  { id: 'ampol',   label: 'Ampol',           group: 'merchant', value: 220 },
  { id: 'bunnings',label: 'Bunnings',        group: 'merchant', value: 155 },
  { id: 'jbhifi', label: 'JB Hi-Fi',        group: 'merchant', value: 200 },
  { id: 'cat-groc',label: 'Groceries',       group: 'category', value: 1100 },
  { id: 'cat-food',label: 'Eating Out',      group: 'category', value: 380 },
  { id: 'cat-tran',label: 'Transport',       group: 'category', value: 450 },
  { id: 'cat-home',label: 'Home',            group: 'category', value: 155 },
  { id: 'cat-elec',label: 'Electronics',     group: 'category', value: 200 },
  { id: 'loc-syd', label: 'Sydney',          group: 'location', value: 2800 },
  { id: 'loc-online', label: 'Online',       group: 'location', value: 1400 },
]

export const MOCK_NETWORK_LINKS: MockNetworkLink[] = [
  { source: 'you',  target: 'woolies',  value: 570 },
  { source: 'you',  target: 'coles',    value: 330 },
  { source: 'you',  target: 'uber',     value: 240 },
  { source: 'you',  target: 'ampol',    value: 220 },
  { source: 'you',  target: 'bunnings', value: 155 },
  { source: 'you',  target: 'jbhifi',  value: 200 },
  { source: 'woolies', target: 'cat-groc', value: 570 },
  { source: 'coles',   target: 'cat-groc', value: 330 },
  { source: 'uber',    target: 'cat-food', value: 240 },
  { source: 'ampol',   target: 'cat-tran', value: 220 },
  { source: 'bunnings', target: 'cat-home', value: 155 },
  { source: 'jbhifi', target: 'cat-elec', value: 200 },
  { source: 'cat-groc', target: 'loc-syd', value: 900 },
  { source: 'cat-food', target: 'loc-online', value: 240 },
  { source: 'cat-tran', target: 'loc-syd', value: 220 },
  { source: 'cat-home', target: 'loc-syd', value: 155 },
  { source: 'cat-elec', target: 'loc-online', value: 200 },
]

// ─── Projections ─────────────────────────────────────────────
export const MOCK_PROJECTIONS: MockProjection[] = Array.from({ length: 24 }, (_, i) => ({
  month: i,
  label: `M${i + 1}`,
  current:   45000 + i * 2800 - (i > 6 ? i * 200 : 0),
  optimized: 45000 + i * 3400 + i * 50,
}))

// ─── Daily Spend (90 days, ECG data) ─────────────────────────
const SPIKE_MERCHANTS = [
  'JB Hi-Fi', 'IKEA', 'Apple Store', 'Flight Centre', 'Dan Murphy\'s',
  'David Jones', 'Bunnings', 'Kmart', 'Officeworks', 'Myer',
  'Harvey Norman', 'The Good Guys', 'Pet Barn', 'Rebel Sport',
]
export const MOCK_DAILY_SPEND: MockDailySpend[] = Array.from({ length: 90 }, (_, i) => {
  const d = new Date(2025, 6, 1)
  d.setDate(d.getDate() + i)
  const dayOfWeek = d.getDay()
  const base = dayOfWeek === 0 || dayOfWeek === 6 ? 120 : 80
  const spike = Math.random() > 0.85 ? 150 + Math.random() * 300 : 0
  const amount = base + Math.random() * 60 + spike
  const isSpike = spike > 0
  return {
    date: d.toISOString().slice(0, 10),
    amount: Math.round(amount * 100) / 100,
    ...(isSpike ? {
      topMerchant: SPIKE_MERCHANTS[i % SPIKE_MERCHANTS.length],
      topAmount: Math.round(spike * 100) / 100,
    } : {}),
  }
})

// ─── Spending DNA ────────────────────────────────────────────
const DNA_CATEGORIES = ['Housing', 'Groceries', 'Transport', 'Eating Out', 'Entertainment', 'Shopping', 'Health', 'Utilities', 'Other']
export const MOCK_DNA: MockDNA[] = MOCK_MONTHLY.map(m => ({
  month: m.label,
  categories: {
    Housing:       1800 / m.expenses,
    Groceries:     (900 + Math.random() * 200) / m.expenses,
    Transport:     (400 + Math.random() * 100) / m.expenses,
    'Eating Out':  (300 + Math.random() * 160) / m.expenses,
    Entertainment: (150 + Math.random() * 100) / m.expenses,
    Shopping:      (100 + Math.random() * 160) / m.expenses,
    Health:        (100 + Math.random() * 60) / m.expenses,
    Utilities:     (240 + Math.random() * 80) / m.expenses,
    Other:         0, // remainder
  },
}))
// Normalise DNA so proportions sum to 1
MOCK_DNA.forEach(d => {
  const sum = Object.values(d.categories).reduce((a, b) => a + b, 0)
  const otherProp = Math.max(0, 1 - sum + d.categories.Other)
  d.categories.Other = otherProp
})

export { DNA_CATEGORIES }

// ─── Transactions (impulse tagging) ──────────────────────────
const TX_TYPES: MockTransaction['type'][] = ['planned', 'necessary', 'emotional', 'opportunistic']
export const MOCK_TRANSACTIONS: MockTransaction[] = MOCK_MERCHANTS.flatMap(m =>
  m.monthlySpend.map((spend, i) => {
    const d = new Date(2024, 9 + i, 1 + Math.floor(Math.random() * 28))
    return {
      date: d.toISOString().slice(0, 10),
      merchant: m.name,
      category: m.category,
      amount: spend,
      type: (m.category === 'Groceries' || m.category === 'Transport'
        ? 'necessary'
        : m.category === 'Eating Out'
          ? TX_TYPES[Math.floor(Math.random() * 3)]
          : TX_TYPES[Math.floor(Math.random() * 4)]) as MockTransaction['type'],
    }
  }),
)
