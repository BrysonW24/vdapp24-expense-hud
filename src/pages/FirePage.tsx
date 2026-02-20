import { useState, useMemo, useEffect } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from 'recharts'
import { useAssets } from '@/hooks/useAssets'
import { useLiabilities } from '@/hooks/useLiabilities'
import { useProperties } from '@/hooks/useProperties'
import { useAllTransactions } from '@/hooks/useTransactions'
import { fireNumber, fatFireNumber, coastFireNumber, yearsToTarget, monthlySavingsNeeded, netWorthProjection } from '@/lib/finance'
import { formatCurrency, formatShortCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { X } from 'lucide-react'
import { subMonths, isBefore } from 'date-fns'

function FireExplainer() {
  const [visible, setVisible] = useState(() =>
    localStorage.getItem('fire-explainer-dismissed') !== 'true'
  )

  useEffect(() => {
    if (!visible) localStorage.setItem('fire-explainer-dismissed', 'true')
  }, [visible])

  if (!visible) return null

  return (
    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🔥</span>
            <p className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
              What is FIRE? <span className="font-normal">(Financial Independence, Retire Early)</span>
            </p>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed mb-3">
            FIRE is a financial movement built around aggressive saving and investing so you can
            retire far earlier than the traditional age. The goal: accumulate enough wealth that
            investment returns cover your living expenses — permanently.
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Lean FIRE</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Minimal lifestyle, bare essentials covered</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">FIRE — the 4% rule</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Save 25× annual expenses. Withdraw 4%/yr</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-amber-200 dark:border-amber-700">
              <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Fat FIRE</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">50× expenses — comfortable, no compromise</p>
            </div>
          </div>
        </div>
        <button onClick={() => setVisible(false)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 mt-0.5 shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function RingProgress({ pct, size = 120, color = '#f97316', label }: { pct: number; size?: number; color?: string; label: string }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(1, Math.max(0, pct / 100)) * circ
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]" style={{ position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={10} className="dark:stroke-slate-700" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-xl font-bold text-gray-800 dark:text-white">{Math.round(pct)}%</span>
        <span className="text-[10px] text-gray-400">{label}</span>
      </div>
    </div>
  )
}

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

export function FirePage() {
  const assets = useAssets()
  const liabilities = useLiabilities()
  const properties = useProperties()
  const transactions = useAllTransactions()

  const now = useMemo(() => new Date(), [])

  // Derived net worth from wealth module
  const derivedAssets = useMemo(() => {
    const manual = assets.reduce((s, a) => s + a.value, 0)
    const propVal = properties.reduce((s, p) => s + p.currentValue, 0)
    return manual + propVal
  }, [assets, properties])

  const derivedLiabilities = useMemo(() => {
    const manual = liabilities.reduce((s, l) => s + l.balance, 0)
    const mortgages = properties.reduce((s, p) => s + p.loanAmount, 0)
    return manual + mortgages
  }, [liabilities, properties])

  // Average monthly savings (last 3 mo)
  const avgMonthlySavings = useMemo(() => {
    const cutoff = subMonths(now, 3)
    const recent = transactions.filter(t => isBefore(cutoff, toDate(t.date)))
    const income = recent.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 3
    const expenses = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)) / 3
    return Math.max(0, income - expenses)
  }, [transactions, now])

  const avgAnnualExpenses = useMemo(() => {
    const cutoff = subMonths(now, 3)
    const recent = transactions.filter(t => isBefore(cutoff, toDate(t.date)))
    const monthly = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)) / 3
    return monthly * 12
  }, [transactions, now])

  // User inputs
  const [netWorthOverride, setNetWorthOverride] = useState('')
  const [annualExpensesOverride, setAnnualExpensesOverride] = useState('')
  const [monthlySavingsOverride, setMonthlySavingsOverride] = useState('')
  const [returnRate, setReturnRate] = useState(7)
  const [inflationRate, setInflationRate] = useState(3)
  const [preservationAge, setPreservationAge] = useState(60)
  const [currentAge, setCurrentAge] = useState(30)
  const [superBalance, setSuperBalance] = useState('')

  const netWorth = parseFloat(netWorthOverride) || (derivedAssets - derivedLiabilities)
  const annualExpenses = parseFloat(annualExpensesOverride) || avgAnnualExpenses
  const monthlySavings = parseFloat(monthlySavingsOverride) || avgMonthlySavings
  const superBal = parseFloat(superBalance) || 0

  const realReturn = returnRate - inflationRate
  const fireNum = fireNumber(annualExpenses)
  const fatFireNum = fatFireNumber(annualExpenses)
  const yearsToPreservation = Math.max(0, preservationAge - currentAge)
  const coastNum = coastFireNumber(fireNum, realReturn, yearsToPreservation)

  const yearsToFire = yearsToTarget(netWorth, fireNum, realReturn, monthlySavings)
  const yearsToFatFire = yearsToTarget(netWorth, fatFireNum, realReturn, monthlySavings)
  const yearsToCoast = yearsToTarget(netWorth, coastNum, realReturn, monthlySavings)

  const fireDate = yearsToFire === Infinity ? null : new Date(now.getFullYear() + Math.ceil(yearsToFire), now.getMonth())
  const fatFireDate = yearsToFatFire === Infinity ? null : new Date(now.getFullYear() + Math.ceil(yearsToFatFire), now.getMonth())
  const coastDate = yearsToCoast === Infinity ? null : new Date(now.getFullYear() + Math.ceil(yearsToCoast), now.getMonth())

  const pctToFire = Math.min(100, fireNum > 0 ? (netWorth / fireNum) * 100 : 0)
  const pctToCoast = Math.min(100, coastNum > 0 ? (netWorth / coastNum) * 100 : 0)

  const mthNeeded = monthlySavingsNeeded(netWorth, fireNum, realReturn, yearsToFire === Infinity ? 30 : yearsToFire)

  // Chart projection
  const projectionMonths = Math.min(600, yearsToFire === Infinity ? 360 : Math.ceil(yearsToFire * 12) + 24)
  const projectionData = useMemo(() =>
    netWorthProjection(netWorth, realReturn, monthlySavings, projectionMonths)
      .filter((_, i) => i % 12 === 0)
      .map(p => ({ year: now.getFullYear() + p.month / 12, value: p.value })),
    [netWorth, realReturn, monthlySavings, projectionMonths, now])

  function formatDate(d: Date | null): string {
    if (!d) return 'Never (at current pace)'
    return d.toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })
  }

  function formatYears(y: number): string {
    if (y === Infinity) return '—'
    const years = Math.floor(y)
    const months = Math.round((y - years) * 12)
    return months > 0 ? `${years}y ${months}m` : `${years}y`
  }

  return (
    <div className="space-y-6">
      <FireExplainer />
      {/* Inputs */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Your Numbers</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Net Worth ($)</label>
            <input type="number" placeholder={String(Math.round(netWorth))} value={netWorthOverride}
              onChange={e => setNetWorthOverride(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30" />
            {(derivedAssets > 0) && <p className="text-[10px] text-gray-400 mt-0.5">Auto: {formatCurrency(derivedAssets - derivedLiabilities)}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Annual Expenses ($)</label>
            <input type="number" placeholder={String(Math.round(annualExpenses))} value={annualExpensesOverride}
              onChange={e => setAnnualExpensesOverride(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30" />
            {avgAnnualExpenses > 0 && <p className="text-[10px] text-gray-400 mt-0.5">From txns: {formatCurrency(avgAnnualExpenses)}/yr</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Monthly Savings ($)</label>
            <input type="number" placeholder={String(Math.round(monthlySavings))} value={monthlySavingsOverride}
              onChange={e => setMonthlySavingsOverride(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Super Balance ($)</label>
            <input type="number" placeholder="0" value={superBalance}
              onChange={e => setSuperBalance(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30" />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Return rate: <strong>{returnRate}%</strong></label>
            <input type="range" min={3} max={12} step={0.5} value={returnRate} onChange={e => setReturnRate(parseFloat(e.target.value))} className="w-full accent-brand" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Inflation: <strong>{inflationRate}%</strong></label>
            <input type="range" min={1} max={6} step={0.5} value={inflationRate} onChange={e => setInflationRate(parseFloat(e.target.value))} className="w-full accent-brand" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Current age: <strong>{currentAge}</strong></label>
            <input type="range" min={18} max={70} value={currentAge} onChange={e => setCurrentAge(parseInt(e.target.value))} className="w-full accent-brand" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Preservation age: <strong>{preservationAge}</strong></label>
            <input type="range" min={55} max={70} value={preservationAge} onChange={e => setPreservationAge(parseInt(e.target.value))} className="w-full accent-brand" />
          </div>
        </div>
      </Card>

      {/* Progress rings */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="flex items-center gap-6">
          <RingProgress pct={pctToFire} size={110} color="#f97316" label="to FIRE" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">FIRE Number</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(fireNum)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">4% rule · {formatYears(yearsToFire)} away</p>
            <p className="text-xs text-brand font-medium mt-1">{fireDate ? formatDate(fireDate) : '—'}</p>
            {monthlySavings > 0 && mthNeeded > 0 && (
              <p className="text-[11px] text-gray-400 mt-1">Need {formatCurrency(mthNeeded)}/mo to stay on track</p>
            )}
          </div>
        </Card>
        <Card className="flex items-center gap-6">
          <RingProgress pct={pctToCoast} size={110} color="#8b5cf6" label="to Coast" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Coast FIRE Number</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(coastNum)}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{formatYears(yearsToCoast)} to coast</p>
            <p className="text-xs text-purple-500 font-medium mt-1">{coastDate ? formatDate(coastDate) : '—'}</p>
          </div>
        </Card>
      </div>

      {/* Fat FIRE + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Fat FIRE Number</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(fatFireNum)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">50× expenses · {formatYears(yearsToFatFire)} away</p>
          <p className="text-xs text-green-500 font-medium mt-1">{fatFireDate ? formatDate(fatFireDate) : '—'}</p>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Real Return Rate</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{realReturn.toFixed(1)}%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{returnRate}% nominal − {inflationRate}% inflation</p>
        </Card>
        {superBal > 0 && (
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Super at {preservationAge}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {formatCurrency(superBal * Math.pow(1 + returnRate / 100, yearsToPreservation))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Projected @ {returnRate}% p.a.</p>
          </Card>
        )}
      </div>

      {/* Projection chart */}
      {projectionData.length > 1 && (
        <Card>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Net Worth Projection</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-700" />
              <XAxis dataKey="year" tickFormatter={v => String(Math.round(v))} tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => formatShortCurrency(v)} tick={{ fontSize: 11 }} width={60} />
              <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} labelFormatter={v => `Year ${Math.round(v as number)}`} />
              <ReferenceLine y={fireNum} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'FIRE', fill: '#f97316', fontSize: 11 }} />
              <ReferenceLine y={coastNum} stroke="#8b5cf6" strokeDasharray="4 4" label={{ value: 'Coast', fill: '#8b5cf6', fontSize: 11 }} />
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  )
}
