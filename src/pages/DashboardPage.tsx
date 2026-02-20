import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Wallet, ArrowRight, Upload } from 'lucide-react'
import { subMonths, isSameMonth } from 'date-fns'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useCategoryMap } from '@/hooks/useCategories'
import { getMonthlyBreakdowns, getTopMerchants } from '@/lib/analytics'
import { formatCurrency, formatShortCurrency, formatDate } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { clsx } from 'clsx'

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

export function DashboardPage() {
  const navigate = useNavigate()
  const transactions = useAllTransactions()
  const categoryMap = useCategoryMap()

  const now = new Date()
  const thisMonth = useMemo(() => transactions.filter(t => isSameMonth(toDate(t.date), now)), [transactions])
  const lastMonth = useMemo(() => transactions.filter(t => isSameMonth(toDate(t.date), subMonths(now, 1))), [transactions])

  const thisIncome = thisMonth.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const thisExpenses = Math.abs(thisMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const lastExpenses = Math.abs(lastMonth.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0))
  const savings = thisIncome - thisExpenses
  const expensePctChange = lastExpenses > 0 ? ((thisExpenses - lastExpenses) / lastExpenses) * 100 : 0

  const monthlyData = useMemo(() => getMonthlyBreakdowns(transactions, 6), [transactions])

  const categorySpend = useMemo(() => {
    const map: Record<number, number> = {}
    for (const tx of thisMonth.filter(t => t.amount < 0)) {
      map[tx.categoryId] = (map[tx.categoryId] ?? 0) + Math.abs(tx.amount)
    }
    return Object.entries(map)
      .map(([id, value]) => ({
        id: Number(id),
        value,
        name: categoryMap[Number(id)]?.name ?? 'Unknown',
        color: categoryMap[Number(id)]?.color ?? '#6b7280',
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [thisMonth, categoryMap])

  const topMerchants = useMemo(() => getTopMerchants(transactions, 5), [transactions])
  const recent = transactions.slice(0, 8)

  const tooltipStyle = { background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 12 }
  const fmt = (v: number | undefined) => formatCurrency(v ?? 0)

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Wallet />}
        title="Welcome to Expense HUD"
        description="Import your bank statement CSV to see your personal finance dashboard."
        action={<Button onClick={() => navigate('/import')}><Upload size={16} /> Import CSV</Button>}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-gray-400 mb-1">Spent this month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatShortCurrency(thisExpenses)}</p>
          <div className={clsx('flex items-center gap-1 mt-1 text-xs font-medium', expensePctChange > 0 ? 'text-red-500' : 'text-emerald-500')}>
            {expensePctChange > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {lastExpenses > 0 ? `${Math.abs(expensePctChange).toFixed(1)}% vs last month` : 'First month of data'}
          </div>
        </Card>
        <Card>
          <p className="text-xs text-gray-400 mb-1">Income this month</p>
          <p className="text-2xl font-bold text-emerald-500">{formatShortCurrency(thisIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">
            Net: <span className={clsx('font-medium', savings >= 0 ? 'text-emerald-500' : 'text-red-500')}>{formatShortCurrency(savings)}</span>
          </p>
        </Card>
      </div>

      {/* Monthly trend */}
      {monthlyData.some(m => m.expenses > 0 || m.income > 0) && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">6-Month Trend</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlyData} barSize={16} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={fmt} contentStyle={tooltipStyle} labelStyle={{ color: '#94a3b8' }} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Category donut */}
      {categorySpend.length > 0 && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Spending by Category</p>
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <PieChart width={140} height={140}>
                <Pie data={categorySpend} dataKey="value" cx={70} cy={70} innerRadius={40} outerRadius={64} paddingAngle={2}>
                  {categorySpend.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              {categorySpend.map(c => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-gray-600 dark:text-gray-400 truncate">{c.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white shrink-0 ml-3">{formatShortCurrency(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top merchants */}
      {topMerchants.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Top Merchants</p>
            <span className="text-xs text-gray-400">All time</span>
          </div>
          <div className="space-y-2">
            {topMerchants.map((m, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{m.name}</span>
                </div>
                <span className="text-sm font-medium text-red-500">-{formatCurrency(m.total)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent transactions */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent</p>
          <button onClick={() => navigate('/transactions')} className="text-xs text-brand flex items-center gap-1">
            View all <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {recent.map(tx => {
            const cat = categoryMap[tx.categoryId]
            return (
              <div key={tx.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (cat?.color ?? '#6b7280') + '22' }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat?.color ?? '#6b7280' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{tx.description}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(toDate(tx.date), 'dd MMM')}</p>
                </div>
                <span className={clsx('text-xs font-semibold tabular-nums shrink-0', tx.amount >= 0 ? 'amount-positive' : 'amount-negative')}>
                  {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
