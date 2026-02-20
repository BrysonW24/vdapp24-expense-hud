import type { Transaction, NetWorthSnapshot, AgentAlert } from '@/types'
import { calcPropertyMetrics } from './finance'
import type { Property } from '@/types'
import { subMonths, isBefore, isSameMonth } from 'date-fns'

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

export function detectAlerts(params: {
  transactions: Transaction[]
  properties: Property[]
  netWorthSnapshots: NetWorthSnapshot[]
  categoryMap: Record<number, { name: string }>
}): AgentAlert[] {
  const { transactions, properties, netWorthSnapshots, categoryMap } = params
  const alerts: AgentAlert[] = []
  const now = new Date()

  // ─── 1. Portfolio LVR > 80% ───────────────────────────────────────────────
  for (const p of properties) {
    const m = calcPropertyMetrics(p)
    if (m.lvr > 80) {
      alerts.push({
        id: `lvr-${p.id}`,
        type: 'warning',
        message: `${p.nickname} has LVR ${m.lvr.toFixed(1)}% — consider reviewing offset balances`,
      })
    }
  }

  // ─── 2. Property cash flow negative ──────────────────────────────────────
  for (const p of properties) {
    const m = calcPropertyMetrics(p)
    if (m.monthlyCashFlow < 0) {
      alerts.push({
        id: `cf-${p.id}`,
        type: 'warning',
        message: `${p.nickname} is cash flow negative (${m.monthlyCashFlow >= 0 ? '+' : ''}$${Math.abs(Math.round(m.monthlyCashFlow))}/mo) — check vacancy or rates`,
      })
    }
  }

  // ─── 3. Subscription spend up >20% MoM ───────────────────────────────────
  const thisMonthTx = transactions.filter(t => isSameMonth(toDate(t.date), now))
  const lastMonthTx = transactions.filter(t => isSameMonth(toDate(t.date), subMonths(now, 1)))

  // Identify "subscription" category IDs by name
  const subCategoryIds = Object.entries(categoryMap)
    .filter(([, c]) => c.name.toLowerCase().includes('subscript'))
    .map(([id]) => parseInt(id))

  if (subCategoryIds.length > 0) {
    const subThisMonth = thisMonthTx
      .filter(t => t.amount < 0 && subCategoryIds.includes(t.categoryId))
      .reduce((s, t) => s + Math.abs(t.amount), 0)
    const subLastMonth = lastMonthTx
      .filter(t => t.amount < 0 && subCategoryIds.includes(t.categoryId))
      .reduce((s, t) => s + Math.abs(t.amount), 0)

    if (subLastMonth > 0 && (subThisMonth - subLastMonth) / subLastMonth > 0.2) {
      const delta = subThisMonth - subLastMonth
      alerts.push({
        id: 'subscriptions-creep',
        type: 'warning',
        message: `Subscription costs jumped $${Math.round(delta)} this month — up ${Math.round(((subThisMonth - subLastMonth) / subLastMonth) * 100)}% MoM`,
      })
    }
  }

  // ─── 4. Net worth declined 2 months in a row ─────────────────────────────
  if (netWorthSnapshots.length >= 3) {
    const last3 = [...netWorthSnapshots].slice(-3)
    if (last3[2].netWorth < last3[1].netWorth && last3[1].netWorth < last3[0].netWorth) {
      alerts.push({
        id: 'nw-decline',
        type: 'warning',
        message: 'Net worth has dropped for 2 consecutive months — review your biggest liabilities',
      })
    }
  }

  // ─── 5. Cash forecast goes negative within 8 weeks ───────────────────────
  const recentIncome = [...transactions]
    .filter(t => t.amount > 0 && isBefore(subMonths(now, 1), toDate(t.date)))
    .reduce((s, t) => s + t.amount, 0)
  const recentExpenses = [...transactions]
    .filter(t => t.amount < 0 && isBefore(subMonths(now, 1), toDate(t.date)))
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const monthlyNet = recentIncome - recentExpenses
  if (monthlyNet < 0) {
    // weeksRunway removed
    const weeksActual = Math.floor(8 - (Math.abs(monthlyNet) / (recentExpenses / 4.33)))
    if (weeksActual < 8) {
      alerts.push({
        id: 'cash-shortfall',
        type: 'warning',
        message: `At current pace, cash runs short in ~${Math.max(1, weeksActual)} weeks — income is below expenses`,
      })
    }
  }

  return alerts
}
