import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowRight, Upload, Eye, PieChart as PieChartIcon, BarChart2, Flame, CreditCard, Layers, Sparkles, Target, Zap } from 'lucide-react'
import { subMonths, isSameMonth } from 'date-fns'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useCategoryMap } from '@/hooks/useCategories'
import { getMonthlyBreakdowns, getTopMerchants } from '@/lib/analytics'
import { formatCurrency, formatShortCurrency, formatDate } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

// ── Preview mock data for empty state ─────────────────────────
const PREVIEW_BARS = [
  { month: 'Sep', expenses: 3200, income: 5400 },
  { month: 'Oct', expenses: 2800, income: 5400 },
  { month: 'Nov', expenses: 4100, income: 5600 },
  { month: 'Dec', expenses: 5200, income: 5400 },
  { month: 'Jan', expenses: 3400, income: 5800 },
  { month: 'Feb', expenses: 2900, income: 5400 },
]

const PREVIEW_CATEGORIES = [
  { name: 'Rent', value: 35, color: '#8b5cf6' },
  { name: 'Groceries', value: 20, color: '#22c55e' },
  { name: 'Dining', value: 15, color: '#f97316' },
  { name: 'Transport', value: 12, color: '#3b82f6' },
  { name: 'Subscriptions', value: 10, color: '#06b6d4' },
  { name: 'Other', value: 8, color: '#6b7280' },
]

const FEATURES = [
  { icon: Upload, label: 'Import CSV', desc: 'Drop your bank statement and watch it come alive', to: '/import', color: 'text-brand' },
  { icon: PieChartIcon, label: 'Net Worth', desc: 'Track assets, liabilities, and your wealth over time', to: '/networth', color: 'text-purple-400' },
  { icon: Eye, label: '22 Visualizations', desc: 'Money particles, spending DNA, cashflow rivers', to: '/visualizations', color: 'text-cyan-400' },
  { icon: Flame, label: 'FIRE Calculator', desc: 'When can you retire? Model your path to freedom', to: '/fire', color: 'text-orange-400' },
  { icon: BarChart2, label: 'Forecast', desc: 'Project your finances 12 months into the future', to: '/forecast', color: 'text-green-400' },
  { icon: CreditCard, label: 'Debt Engine', desc: 'Snowball or avalanche — crush your debt faster', to: '/debt', color: 'text-red-400' },
  { icon: Layers, label: 'Simulate', desc: 'What if I bought a car? Took a paycut? Moved cities?', to: '/simulate', color: 'text-blue-400' },
  { icon: Target, label: 'Goals', desc: 'Set savings targets and track your progress', to: '/insights', color: 'text-emerald-400' },
]

function OnboardingDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-charcoal to-charcoal-light p-6 lg:p-8">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/5 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-500/5 blur-2xl" />
          {/* Floating dots */}
          <div className="absolute top-8 right-20 w-1.5 h-1.5 rounded-full bg-brand/30 animate-pulse" />
          <div className="absolute top-16 right-40 w-1 h-1 rounded-full bg-cyan-400/30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-12 right-28 w-1.5 h-1.5 rounded-full bg-green-400/20 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand" />
              <span className="text-xs font-medium text-brand">Your dashboard is ready</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              Let's bring your finances to life
            </h2>
            <p className="text-gray-400 text-sm max-w-md leading-relaxed">
              Import a bank statement CSV and your dashboard will instantly populate with spending breakdowns, trends, and insights.
            </p>
          </div>

          <div className="shrink-0">
            <Button size="lg" className="px-8" onClick={() => navigate('/import')}>
              <Upload size={16} />
              Import Your First CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Preview cards — shows what the dashboard WILL look like */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3 px-1">Preview — what your dashboard will look like</p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Fake KPIs */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-500/5" />
              <div className="relative">
                <p className="text-[10px] text-gray-400 mb-1">Spent this month</p>
                <p className="text-xl font-bold text-gray-300 dark:text-gray-500">$2,847</p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-red-400/50">
                  <TrendingUp size={10} />
                  12.3% vs last month
                </div>
              </div>
            </Card>
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-green-500/5" />
              <div className="relative">
                <p className="text-[10px] text-gray-400 mb-1">Income</p>
                <p className="text-xl font-bold text-gray-300 dark:text-gray-500">$5,400</p>
                <p className="text-[10px] text-gray-400/50 mt-1">
                  Net: <span className="text-emerald-400/50">+$2,553</span>
                </p>
              </div>
            </Card>
          </div>

          {/* Fake category donut */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-500/5" />
            <div className="relative">
              <p className="text-xs font-medium text-gray-400 mb-3">Spending by Category</p>
              <div className="flex items-center gap-4">
                <div className="shrink-0 opacity-40">
                  <PieChart width={80} height={80}>
                    <Pie data={PREVIEW_CATEGORIES} dataKey="value" cx={40} cy={40} innerRadius={24} outerRadius={36} paddingAngle={2}>
                      {PREVIEW_CATEGORIES.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </div>
                <div className="flex-1 space-y-1.5">
                  {PREVIEW_CATEGORIES.slice(0, 4).map(c => (
                    <div key={c.name} className="flex items-center gap-2 text-[11px]">
                      <div className="w-2 h-2 rounded-full opacity-40" style={{ backgroundColor: c.color }} />
                      <span className="text-gray-500">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Fake trend chart */}
        <Card className="mt-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-500/5" />
          <div className="relative">
            <p className="text-xs font-medium text-gray-400 mb-3">6-Month Trend</p>
            <div className="opacity-30">
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={PREVIEW_BARS} barSize={12} barGap={4}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="income" fill="#22c55e" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Overlay CTA */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => navigate('/import')}
              className="px-4 py-2 rounded-xl bg-charcoal/90 backdrop-blur text-white text-xs font-medium border border-white/10 hover:bg-charcoal transition-colors flex items-center gap-2"
            >
              <Zap size={12} className="text-brand" />
              Import data to see your real trends
            </button>
          </div>
        </Card>
      </div>

      {/* Visualizations showcase */}
      <button
        onClick={() => navigate('/visualizations')}
        className="group w-full text-left relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-charcoal to-slate-900 border border-white/5 hover:border-brand/20 transition-all hover:shadow-xl"
      >
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-pulse"
              style={{
                width: 3 + (i % 3) * 2,
                height: 3 + (i % 3) * 2,
                top: `${10 + (i * 7) % 80}%`,
                left: `${5 + (i * 11) % 90}%`,
                backgroundColor: ['#FF6B35', '#22c55e', '#3b82f6', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#eab308', '#14b8a6', '#ef4444', '#a855f7', '#f43f5e'][i],
                opacity: 0.2 + (i % 4) * 0.1,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${2 + (i % 3)}s`,
              }}
            />
          ))}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-brand/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-purple-500/5 blur-3xl" />
        </div>

        <div className="relative z-10 p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={14} className="text-brand" />
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">Featured</span>
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                22 Interactive Visualizations
              </h3>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                Money particles, spending DNA, cashflow rivers, subscription orbits, financial heartbeats — your data has never looked this alive.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-brand group-hover:gap-3 transition-all shrink-0">
              Explore Gallery
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Mini viz category pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            {['Spatial', 'Time', 'Behaviour', 'Network', 'Emotional', 'Predictive', 'Experimental'].map(cat => (
              <span key={cat} className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 text-gray-500 font-medium">
                {cat}
              </span>
            ))}
          </div>
        </div>
      </button>

      {/* Feature grid */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3 px-1">Explore what's possible</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc, to, color }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="group text-left bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-white/5 hover:border-brand/30 dark:hover:border-brand/30 transition-all hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-slate-700 group-hover:bg-brand/10 transition-colors shrink-0')}>
                  <Icon size={16} className={clsx(color, 'group-hover:text-brand transition-colors')} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    {label}
                    <ArrowRight size={12} className="text-gray-300 dark:text-gray-600 group-hover:text-brand group-hover:translate-x-0.5 transition-all" />
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────

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
    return <OnboardingDashboard />
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
