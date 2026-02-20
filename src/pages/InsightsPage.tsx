import { useMemo, useState } from 'react'
import {
  AlertTriangle, CheckCircle, Info, BarChart2, RefreshCw, Calendar,
  TrendingUp, Target, Plus, Trash2, X, DollarSign, PiggyBank, ShoppingBag, ArrowUpCircle
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useGoals, addGoal, deleteGoal } from '@/hooks/useGoals'
import {
  getMonthlyBreakdowns, getSpendingByDayOfWeek, detectRecurring,
  generateInsights, getGoalProgress, getCashFlowScore
} from '@/lib/analytics'
import { formatCurrency, formatShortCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsx } from 'clsx'
import type { Goal } from '@/types'

const tooltipStyle = { background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }
const fmt = (v: number | undefined) => formatCurrency(v ?? 0)
const fmtShort = (v: number | undefined) => formatShortCurrency(v ?? 0)

function RingProgress({ pct, color, size = 64 }: { pct: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, pct) / 100) * circ
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={6} className="text-gray-200 dark:text-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

const INSIGHT_STYLES = {
  warning: {
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: <AlertTriangle size={14} className="text-amber-500" />,
    headlineColor: 'text-amber-600 dark:text-amber-400',
  },
  positive: {
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: <CheckCircle size={14} className="text-emerald-500" />,
    headlineColor: 'text-emerald-600 dark:text-emerald-400',
  },
  info: {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    icon: <Info size={14} className="text-blue-500" />,
    headlineColor: 'text-blue-600 dark:text-blue-400',
  },
}

const GOAL_TYPE_META: Record<Goal['type'], { label: string; icon: React.ReactNode; color: string; description: string }> = {
  save: { label: 'Save amount', icon: <PiggyBank size={16} />, color: '#22c55e', description: 'Track net savings this month' },
  spend_limit: { label: 'Spending limit', icon: <ShoppingBag size={16} />, color: '#ef4444', description: 'Cap total monthly spending' },
  category_limit: { label: 'Category limit', icon: <Target size={16} />, color: '#f97316', description: 'Limit spend in one category' },
  income_target: { label: 'Income target', icon: <ArrowUpCircle size={16} />, color: '#3b82f6', description: 'Hit an income goal this month' },
}

function GoalModal({ categories, onClose }: { categories: ReturnType<typeof useCategories>; onClose: () => void }) {
  const [type, setType] = useState<Goal['type']>('save')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)

  const expenseCategories = categories.filter(c => c.type === 'expense')

  const defaultTitles: Record<Goal['type'], string> = {
    save: 'Save this month',
    spend_limit: 'Monthly spending limit',
    category_limit: 'Category limit',
    income_target: 'Income target',
  }

  const handleSubmit = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return
    setSaving(true)
    await addGoal({
      type,
      title: title.trim() || defaultTitles[type],
      targetAmount: amt,
      categoryId: type === 'category_limit' && categoryId !== '' ? Number(categoryId) : undefined,
      createdAt: new Date(),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900 dark:text-white">New Goal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(GOAL_TYPE_META) as [Goal['type'], (typeof GOAL_TYPE_META)[Goal['type']]][]).map(([t, meta]) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx(
                'flex flex-col gap-1 p-3 rounded-xl border text-left transition-colors',
                type === t ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-slate-600'
              )}
            >
              <span style={{ color: meta.color }}>{meta.icon}</span>
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{meta.label}</span>
              <span className="text-[10px] text-gray-400">{meta.description}</span>
            </button>
          ))}
        </div>

        {type === 'category_limit' && (
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Category</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand"
            >
              <option value="">Select category...</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">Label (optional)</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={defaultTitles[type]}
            className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand placeholder:text-gray-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            {type === 'spend_limit' || type === 'category_limit' ? 'Limit ($)' : 'Target ($)'}
          </label>
          <div className="relative">
            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              className="w-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={saving || !amount} className="w-full">
          {saving ? 'Saving...' : 'Add Goal'}
        </Button>
      </div>
    </div>
  )
}

// ─── RecurringCard ─────────────────────────────────────────────────────────

type RecurringItem = { name: string; count: number; avgAmount: number; categoryName: string; annualCost: number }

const RECURRING_TABS = ['All', 'Subscriptions', 'Other'] as const
type RecurringTab = typeof RECURRING_TABS[number]

function classifyRecurring(r: RecurringItem): RecurringTab {
  const lower = r.categoryName.toLowerCase()
  if (lower.includes('subscript') || lower.includes('stream') || lower.includes('software')) return 'Subscriptions'
  return 'Other'
}

function RecurringCard({ recurring, totalRecurring }: { recurring: RecurringItem[]; totalRecurring: number }) {
  const [tab, setTab] = useState<RecurringTab>('All')
  const annualTotal = totalRecurring * 12

  const filtered = tab === 'All' ? recurring : recurring.filter(r => classifyRecurring(r) === tab)

  const badgeColor = annualTotal < 5000
    ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
    : annualTotal < 15000
    ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
    : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <RefreshCw size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recurring Expenses</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Monthly total</p>
          <p className="text-sm font-bold text-red-500">-{formatCurrency(totalRecurring)}</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {RECURRING_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={clsx('px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
              tab === t
                ? 'bg-brand text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
            )}>
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r, i) => (
          <div key={i} className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-3">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{r.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.categoryName} · seen {r.count}×</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-red-500">-{formatCurrency(r.avgAmount)}/mo</p>
              <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{formatCurrency(r.annualCost)}/yr</p>
              <p className="text-[10px] text-gray-400">${(r.annualCost / 365).toFixed(2)}/day</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">No items in this category</p>
        )}
      </div>

      <div className={clsx('mt-4 rounded-xl border px-4 py-3 flex items-center justify-between', badgeColor)}>
        <div>
          <p className="text-xs font-semibold">Annual Recurring Cost</p>
          <p className="text-[10px] opacity-70 mt-0.5">
            {annualTotal < 5000 ? 'Looking manageable' : annualTotal < 15000 ? 'Worth reviewing' : 'High — consider cutting subscriptions'}
          </p>
        </div>
        <p className="text-xl font-bold">{formatCurrency(annualTotal)}</p>
      </div>
    </Card>
  )
}

// ─── SpendingCalendar ───────────────────────────────────────────────────────

import { format as fmtDate, getDaysInMonth as getDIM, startOfMonth, getDay, isSameDay } from 'date-fns'
import type { Transaction as TxType } from '@/types'

type DayData = { date: Date; spend: number; income: number; txCount: number }

function SpendingCalendar({ transactions: txs }: { transactions: TxType[] }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  function toD(d: Date | string | number): Date {
    return d instanceof Date ? d : new Date(d)
  }

  const { days, avgDailySpend } = useMemo(() => {
    const daysInMonth = getDIM(new Date(viewYear, viewMonth, 1))
    const dayMap: Record<string, DayData> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d)
      const key = fmtDate(date, 'yyyy-MM-dd')
      dayMap[key] = { date, spend: 0, income: 0, txCount: 0 }
    }

    for (const tx of txs) {
      const txDate = toD(tx.date)
      if (txDate.getFullYear() === viewYear && txDate.getMonth() === viewMonth) {
        const key = fmtDate(txDate, 'yyyy-MM-dd')
        if (dayMap[key]) {
          if (tx.amount < 0) { dayMap[key].spend += Math.abs(tx.amount); dayMap[key].txCount++ }
          else dayMap[key].income += tx.amount
        }
      }
    }

    const allDays = Object.values(dayMap)
    const spendingDays = allDays.filter(d => d.spend > 0)
    const avg = spendingDays.length > 0 ? spendingDays.reduce((s, d) => s + d.spend, 0) / spendingDays.length : 0
    return { days: allDays, avgDailySpend: avg }
  }, [txs, viewYear, viewMonth])

  function heatBg(spend: number): string {
    if (spend === 0) return 'bg-gray-100 dark:bg-slate-800'
    if (spend < avgDailySpend) return 'bg-green-100 dark:bg-green-900/30'
    if (spend < avgDailySpend * 2) return 'bg-amber-100 dark:bg-amber-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  function heatText(spend: number): string {
    if (spend === 0) return 'text-gray-400 dark:text-gray-600'
    if (spend < avgDailySpend) return 'text-green-700 dark:text-green-400'
    if (spend < avgDailySpend * 2) return 'text-amber-700 dark:text-amber-400'
    return 'text-red-700 dark:text-red-400'
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // 0=Mon offset
  const firstDow = (getDay(startOfMonth(new Date(viewYear, viewMonth, 1))) + 6) % 7
  const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const selectedTxs = selectedDay
    ? txs.filter(tx => isSameDay(toD(tx.date), selectedDay.date)).sort((a, b) => a.amount - b.amount)
    : []

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Spending Heatmap</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors text-base">‹</button>
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-28 text-center">
            {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 transition-colors text-base">›</button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 text-[10px] text-gray-400">
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-green-100 dark:bg-green-900/30" />Low</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-amber-100 dark:bg-amber-900/30" />Med</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-100 dark:bg-red-900/30" />High</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" />Income</div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map(d => <div key={d} className="text-center text-[10px] text-gray-400 font-medium py-0.5">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDow }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map((day, i) => {
          const isToday = isSameDay(day.date, today)
          const isSel = selectedDay ? isSameDay(day.date, selectedDay.date) : false
          return (
            <button key={i} onClick={() => setSelectedDay(isSel ? null : day)}
              className={clsx(
                'relative rounded-lg p-1 min-h-[44px] flex flex-col items-center justify-start transition-all hover:opacity-80',
                heatBg(day.spend),
                isSel && 'ring-2 ring-brand',
                isToday && !isSel && 'ring-1 ring-gray-400 dark:ring-gray-500',
              )}>
              <span className={clsx('text-[10px] font-medium', isToday ? 'text-brand font-bold' : 'text-gray-600 dark:text-gray-400')}>
                {day.date.getDate()}
              </span>
              {day.spend > 0 && (
                <span className={clsx('text-[9px] font-semibold leading-tight mt-0.5', heatText(day.spend))}>
                  ${day.spend >= 1000 ? `${(day.spend / 1000).toFixed(1)}k` : Math.round(day.spend)}
                </span>
              )}
              {day.income > 0 && (
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-400" />
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {selectedDay.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="flex gap-3 mt-0.5">
                {selectedDay.spend > 0 && <p className="text-xs text-red-500">-{formatCurrency(selectedDay.spend)} · {selectedDay.txCount} tx</p>}
                {selectedDay.income > 0 && <p className="text-xs text-green-600 dark:text-green-400">+{formatCurrency(selectedDay.income)}</p>}
                {selectedDay.spend === 0 && selectedDay.income === 0 && <p className="text-xs text-gray-400">No transactions</p>}
              </div>
            </div>
            <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2">
              <X size={15} />
            </button>
          </div>
          {selectedTxs.length > 0 && (
            <div className="space-y-1.5">
              {selectedTxs.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-800 last:border-0">
                  <p className="text-xs text-gray-700 dark:text-gray-300 truncate max-w-[220px]">{tx.description}</p>
                  <span className={clsx('text-xs font-semibold ml-2 shrink-0', tx.amount < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400')}>
                    {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

// ─── InsightsPage ───────────────────────────────────────────────────────────

export function InsightsPage() {
  const transactions = useAllTransactions()
  const categories = useCategories()
  const goals = useGoals()
  const [showGoalModal, setShowGoalModal] = useState(false)

  const monthlyData = useMemo(() => getMonthlyBreakdowns(transactions, 6), [transactions])
  const dayOfWeekData = useMemo(() => getSpendingByDayOfWeek(transactions), [transactions])
  const recurring = useMemo(() => detectRecurring(transactions, categories), [transactions, categories])
  const insights = useMemo(() => generateInsights(transactions, categories), [transactions, categories])
  const score = useMemo(() => getCashFlowScore(transactions), [transactions])
  const totalRecurring = recurring.reduce((s, r) => s + r.avgAmount, 0)

  const goalProgresses = useMemo(
    () => goals.map(g => ({ goal: g, progress: getGoalProgress(g, transactions) })),
    [goals, transactions]
  )

  if (transactions.length === 0) {
    return <EmptyState icon={<TrendingUp />} title="No data yet" description="Import your bank statements to see spending insights and recommendations." />
  }

  const peakDay = dayOfWeekData.reduce((max, d) => d.total > max.total ? d : max, dayOfWeekData[0])
  const scoreColor = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const scoreLabel = score >= 70 ? 'Healthy' : score >= 40 ? 'Fair' : 'At risk'

  return (
    <div className="space-y-6">

      {/* Goals */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Goals</h3>
          <button
            onClick={() => setShowGoalModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand hover:opacity-75 transition-opacity"
          >
            <Plus size={14} /> Add goal
          </button>
        </div>

        {goals.length === 0 ? (
          <button
            onClick={() => setShowGoalModal(true)}
            className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-brand hover:text-brand transition-colors"
          >
            <Target size={24} />
            <p className="text-sm font-medium">Set a financial goal</p>
            <p className="text-xs">Save more, spend less, hit targets — track it here</p>
          </button>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goalProgresses.map(({ goal, progress }) => {
              const meta = GOAL_TYPE_META[goal.type]
              const isLimitGoal = goal.type === 'spend_limit' || goal.type === 'category_limit'
              const ringColor = isLimitGoal
                ? (progress.pct > 90 ? '#ef4444' : progress.pct > 70 ? '#f59e0b' : '#22c55e')
                : (progress.pct >= 100 ? '#22c55e' : meta.color)
              return (
                <div key={goal.id} className="hud-card relative group">
                  <button
                    onClick={() => goal.id && deleteGoal(goal.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className="flex items-center gap-3">
                    <RingProgress pct={progress.pct} color={ringColor} size={60} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{goal.title}</p>
                      <p className="text-[10px] text-gray-400 mb-1">{meta.label}</p>
                      <p className="text-xs font-bold" style={{ color: ringColor }}>
                        {formatShortCurrency(progress.current)}
                        <span className="font-normal text-gray-400"> / {formatShortCurrency(progress.target)}</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 leading-tight">{progress.coaching}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Cash flow score */}
      <Card>
        <div className="flex items-center gap-4">
          <RingProgress pct={score} color={scoreColor} size={72} />
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Cash flow score</p>
            <p className="text-2xl font-bold" style={{ color: scoreColor }}>
              {score}<span className="text-sm font-normal text-gray-400">/100</span>
            </p>
            <p className="text-sm font-semibold" style={{ color: scoreColor }}>{scoreLabel}</p>
            <p className="text-xs text-gray-400 mt-0.5">Based on last 3 months of income vs spending</p>
          </div>
        </div>
      </Card>

      {/* Insights 2-col grid */}
      <section>
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((insight, i) => {
            const style = INSIGHT_STYLES[insight.type]
            return (
              <div key={i} className={clsx('rounded-2xl p-4 border', style.bg, style.border)}>
                <div className="flex items-center gap-1.5 mb-2">
                  {style.icon}
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{insight.title}</p>
                </div>
                {insight.headline && (
                  <p className={clsx('text-2xl font-bold leading-none mb-1.5', style.headlineColor)}>
                    {insight.headline}
                    {insight.headlineSub && (
                      <span className="text-xs font-normal text-gray-400 ml-1.5">{insight.headlineSub}</span>
                    )}
                  </p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{insight.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Monthly breakdown */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Monthly Breakdown</p>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData} barSize={12} barGap={2}>
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
            <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="net" name="Net" fill="#FF6B35" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Day of week */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Spending by Day of Week</p>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={dayOfWeekData} barSize={28}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip formatter={fmtShort} contentStyle={tooltipStyle} />
            <Bar dataKey="total" fill="#FF6B35" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {peakDay && <p className="text-xs text-gray-400 mt-2">{peakDay.name} is your biggest spending day</p>}
      </Card>

      {/* Spending calendar heatmap */}
      <SpendingCalendar transactions={transactions} />

      {/* Recurring */}
      {recurring.length > 0 && (
        <RecurringCard recurring={recurring} totalRecurring={totalRecurring} />
      )}

      {/* Net savings trend */}
      {monthlyData.length > 1 && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Net Savings Trend</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="net" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3, fill: '#FF6B35' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {showGoalModal && <GoalModal categories={categories} onClose={() => setShowGoalModal(false)} />}
    </div>
  )
}
