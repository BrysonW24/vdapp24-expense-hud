import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'
import { useLiabilities } from '@/hooks/useLiabilities'
import { snowballStrategy, avalancheStrategy } from '@/lib/finance'
import { formatCurrency, formatShortCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'
import type { DebtItem } from '@/lib/finance'

export function DebtPage() {
  const liabilities = useLiabilities()
  const [extraPayment, setExtraPayment] = useState(0)
  // tab state removed

  // Map liabilities to DebtItem — skip those without interest rates (e.g. HECS)
  const debts: DebtItem[] = useMemo(() =>
    liabilities
      .filter(l => l.balance > 0 && (l.interestRate ?? 0) > 0)
      .map(l => ({
        id: String(l.id),
        name: l.name,
        balance: l.balance,
        annualRate: l.interestRate ?? 0,
        minPayment: l.minPayment ?? Math.round(l.balance * 0.02), // 2% of balance as fallback
      })),
    [liabilities])

  const snowball = useMemo(() => snowballStrategy(debts, extraPayment), [debts, extraPayment])
  const avalanche = useMemo(() => avalancheStrategy(debts, extraPayment), [debts, extraPayment])

  const interestSaved = snowball.totalInterest - avalanche.totalInterest
  const monthsSaved = snowball.monthsToPayoff - avalanche.monthsToPayoff

  // Chart data: merge schedules to show total balances over time
  function buildChartData(
    schedule: Array<{ month: number; balances: Record<string, number> }>,
    label: string,
  ) {
    return schedule.map(s => ({
      month: s.month,
      [label]: Math.round(Object.values(s.balances).reduce((a, b) => a + b, 0)),
    }))
  }

  const snowballChart = buildChartData(snowball.schedule, 'Snowball')
  const avalancheChart = buildChartData(avalanche.schedule, 'Avalanche')

  // Merge by month index
  const chartData = useMemo(() => {
    const maxLen = Math.max(snowballChart.length, avalancheChart.length)
    return Array.from({ length: maxLen }, (_, i) => ({
      month: snowballChart[i]?.month ?? avalancheChart[i]?.month ?? i * 3,
      Snowball: snowballChart[i]?.Snowball ?? 0,
      Avalanche: avalancheChart[i]?.Avalanche ?? 0,
    }))
  }, [snowballChart, avalancheChart])

  const totalMinPayments = debts.reduce((s, d) => s + d.minPayment, 0)

  if (debts.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No debts with interest rates found</p>
          <p className="text-sm text-gray-400 mt-1">
            Add liabilities with an interest rate in the Net Worth page to model payoff strategies.
          </p>
          <Button className="mt-4" onClick={() => window.history.back()}>Go to Net Worth</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Extra payment slider */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Extra Monthly Payment</p>
          <span className="text-xl font-bold text-brand">+{formatCurrency(extraPayment)}/mo</span>
        </div>
        <input type="range" min={0} max={5000} step={50} value={extraPayment}
          onChange={e => setExtraPayment(parseInt(e.target.value))}
          className="w-full accent-brand" />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$0</span>
          <span>Minimum total: {formatCurrency(totalMinPayments)}/mo</span>
          <span>$5,000</span>
        </div>
      </Card>

      {/* Strategy comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Snowball Strategy</p>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">Smallest balance first — psychological wins</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total interest paid</span>
              <span className="font-semibold text-red-500">{formatCurrency(snowball.totalInterest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Payoff date</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {snowball.monthsToPayoff === 0 ? 'Already paid' : snowball.payoffDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Months to payoff</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{snowball.monthsToPayoff}</span>
            </div>
          </div>
          {snowball.order.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-[11px] text-gray-400 mb-1">Payoff order</p>
              <div className="flex flex-wrap gap-1">
                {snowball.order.map((name, i) => (
                  <span key={i} className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                    {i + 1}. {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="border-2 border-green-200 dark:border-green-700">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Avalanche Strategy</p>
          </div>
          <p className="text-[11px] text-gray-400 mb-3">Highest interest rate first — mathematically optimal</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total interest paid</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(avalanche.totalInterest)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Payoff date</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {avalanche.monthsToPayoff === 0 ? 'Already paid' : avalanche.payoffDate.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Months to payoff</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{avalanche.monthsToPayoff}</span>
            </div>
          </div>
          {avalanche.order.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
              <p className="text-[11px] text-gray-400 mb-1">Payoff order</p>
              <div className="flex flex-wrap gap-1">
                {avalanche.order.map((name, i) => (
                  <span key={i} className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                    {i + 1}. {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Savings summary */}
      {interestSaved !== 0 && (
        <Card className={clsx(
          'border-2',
          interestSaved > 0 ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10' : 'border-gray-200 dark:border-slate-700'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Avalanche saves you {formatCurrency(Math.abs(interestSaved))} in interest
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                and pays off {Math.abs(monthsSaved)} months {monthsSaved > 0 ? 'sooner' : 'later'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(Math.abs(interestSaved))}</p>
              <p className="text-xs text-gray-400">saved</p>
            </div>
          </div>
        </Card>
      )}

      {/* Debt list */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Your Debts</p>
        <div className="space-y-2">
          {debts.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{d.name}</p>
                <p className="text-xs text-gray-400">{d.annualRate}% p.a. · min {formatCurrency(d.minPayment)}/mo</p>
              </div>
              <span className="text-sm font-semibold text-red-500">{formatCurrency(d.balance)}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Payoff chart */}
      {chartData.length > 1 && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Total Debt Over Time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-700" />
              <XAxis dataKey="month" tickFormatter={v => `Mo ${v}`} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => formatShortCurrency(v)} tick={{ fontSize: 11 }} width={55} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
              <Legend />
              <Line type="monotone" dataKey="Snowball" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Avalanche" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
