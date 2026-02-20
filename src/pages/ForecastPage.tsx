import { useState, useMemo } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine
} from 'recharts'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useProperties } from '@/hooks/useProperties'
import { buildForecast, calcPropertyMetrics } from '@/lib/finance'
import { formatCurrency, formatShortCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { clsx } from 'clsx'
import { isBefore, subMonths } from 'date-fns'

type Scenario = 'Base' | 'Optimistic' | 'Pessimistic'

const SCENARIO_CONFIG: Record<Scenario, { incomeM: number; expenseM: number; color: string; desc: string }> = {
  Base: { incomeM: 1, expenseM: 1, color: '#3b82f6', desc: 'Current trajectory' },
  Optimistic: { incomeM: 1.1, expenseM: 0.95, color: '#22c55e', desc: '+10% income, −5% expenses' },
  Pessimistic: { incomeM: 0.85, expenseM: 1.1, color: '#ef4444', desc: '−15% income, +10% expenses' },
}

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

export function ForecastPage() {
  const transactions = useAllTransactions()
  const properties = useProperties()

  const [scenario, setScenario] = useState<Scenario>('Base')
  const [incomeOverride, setIncomeOverride] = useState(0)   // % adjustment -50 to +50
  const [expenseOverride, setExpenseOverride] = useState(0)
  const [currentSavings, setCurrentSavings] = useState('')

  const now = useMemo(() => new Date(), [])

  // Average income + expenses over last 3 months
  const { avgIncome, avgExpenses } = useMemo(() => {
    const cutoff = subMonths(now, 3)
    const recent = transactions.filter(t => isBefore(cutoff, toDate(t.date)))
    const income = recent.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 3
    const expenses = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)) / 3
    return { avgIncome: income, avgExpenses: expenses }
  }, [transactions, now])

  // Property cash flows
  const propertyCashFlow = useMemo(() =>
    properties.reduce((s, p) => s + calcPropertyMetrics(p).monthlyCashFlow, 0),
    [properties])

  const cfg = SCENARIO_CONFIG[scenario]
  const incomeMult = cfg.incomeM * (1 + incomeOverride / 100)
  const expenseMult = cfg.expenseM * (1 + expenseOverride / 100)

  const savings = parseFloat(currentSavings) || 0

  const forecast = useMemo(() =>
    buildForecast(avgIncome, avgExpenses, savings, propertyCashFlow, incomeMult, expenseMult, 12),
    [avgIncome, avgExpenses, savings, propertyCashFlow, incomeMult, expenseMult])

  const runway = useMemo(() => {
    const monthlyExpense = avgExpenses * expenseMult
    return monthlyExpense > 0 ? Math.max(0, savings / monthlyExpense) : Infinity
  }, [savings, avgExpenses, expenseMult])

  const monthlyNet = (avgIncome * incomeMult) - (avgExpenses * expenseMult) + propertyCashFlow
  const annualSurplus = monthlyNet * 12

  return (
    <div className="space-y-6">
      {/* Scenario tabs + inputs */}
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Scenario</p>
          <div className="flex gap-2">
            {(Object.keys(SCENARIO_CONFIG) as Scenario[]).map(s => (
              <button key={s} onClick={() => setScenario(s)}
                className={clsx('flex-1 py-2 rounded-xl text-sm font-medium transition-colors',
                  scenario === s
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                )}
                style={scenario === s ? { background: SCENARIO_CONFIG[s].color } : {}}>
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">{SCENARIO_CONFIG[scenario].desc}</p>
        </Card>

        <Card className="flex-1">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Manual Overrides</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Income adjustment</span>
                <span className={incomeOverride >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                  {incomeOverride >= 0 ? '+' : ''}{incomeOverride}%
                </span>
              </div>
              <input type="range" min="-50" max="50" step="5" value={incomeOverride}
                onChange={e => setIncomeOverride(parseInt(e.target.value))}
                className="w-full accent-brand" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Expense adjustment</span>
                <span className={expenseOverride <= 0 ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}>
                  {expenseOverride >= 0 ? '+' : ''}{expenseOverride}%
                </span>
              </div>
              <input type="range" min="-50" max="50" step="5" value={expenseOverride}
                onChange={e => setExpenseOverride(parseInt(e.target.value))}
                className="w-full accent-brand" />
            </div>
          </div>
        </Card>

        <Card className="lg:w-52">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Current Savings ($)</p>
          <input type="number" placeholder="e.g. 30000"
            value={currentSavings} onChange={e => setCurrentSavings(e.target.value)}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30" />
          {propertyCashFlow !== 0 && (
            <p className="text-[11px] text-gray-400 mt-2">
              Property cash flow: {propertyCashFlow >= 0 ? '+' : ''}{formatCurrency(propertyCashFlow)}/mo
            </p>
          )}
        </Card>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Monthly Income</p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(avgIncome * incomeMult)}</p>
          {avgIncome === 0 && <p className="text-[10px] text-gray-400 mt-0.5">No transactions yet</p>}
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Monthly Expenses</p>
          <p className="text-xl font-bold text-red-500 mt-1">{formatCurrency(avgExpenses * expenseMult)}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Monthly Net</p>
          <p className={clsx('text-xl font-bold mt-1', monthlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
            {monthlyNet >= 0 ? '+' : ''}{formatCurrency(monthlyNet)}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{formatCurrency(Math.abs(annualSurplus))}/yr {annualSurplus >= 0 ? 'surplus' : 'deficit'}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Cash Runway</p>
          {currentSavings ? (
            <p className={clsx('text-xl font-bold mt-1', runway >= 6 ? 'text-green-600 dark:text-green-400' : runway >= 3 ? 'text-amber-600' : 'text-red-500')}>
              {runway === Infinity ? '∞' : `${runway.toFixed(1)} mo`}
            </p>
          ) : (
            <p className="text-sm text-gray-400 mt-1">Enter savings above</p>
          )}
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">12-Month Projection — {scenario}</p>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={forecast.months}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-700" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={v => formatShortCurrency(v)} tick={{ fontSize: 11 }} width={55} />
            <Tooltip formatter={(v: unknown, name: unknown) => [formatCurrency(v as number), name === 'income' ? 'Income' : name === 'expenses' ? 'Expenses' : 'Net']} />
            <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} fill="url(#incomeGrad)" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expenseGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly table */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Monthly Breakdown</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-slate-700">
                <th className="text-left py-2">Month</th>
                <th className="text-right py-2">Income</th>
                <th className="text-right py-2">Expenses</th>
                <th className="text-right py-2">Net</th>
                {currentSavings && <th className="text-right py-2">Balance</th>}
              </tr>
            </thead>
            <tbody>
              {forecast.months.map((m, i) => (
                <tr key={i} className="border-b border-gray-50 dark:border-slate-800">
                  <td className="py-2 text-gray-700 dark:text-gray-300">{m.label}</td>
                  <td className="py-2 text-right text-green-600 dark:text-green-400">{formatCurrency(m.income)}</td>
                  <td className="py-2 text-right text-red-500">{formatCurrency(m.expenses)}</td>
                  <td className={clsx('py-2 text-right font-medium', m.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                    {m.net >= 0 ? '+' : ''}{formatCurrency(m.net)}
                  </td>
                  {currentSavings && (
                    <td className={clsx('py-2 text-right font-semibold', m.cumulative >= 0 ? 'text-gray-800 dark:text-gray-200' : 'text-red-500')}>
                      {formatCurrency(m.cumulative)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
