import { useState, useMemo } from 'react'
import { useProperties } from '@/hooks/useProperties'
import { useAssets } from '@/hooks/useAssets'
import { useLiabilities } from '@/hooks/useLiabilities'
import { useAllTransactions } from '@/hooks/useTransactions'
import {
  simulateBuyProperty, simulateRateRise, simulateLumpSum,
  calcPropertyMetrics,
} from '@/lib/finance'
import { formatCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { clsx } from 'clsx'
import { subMonths, isBefore } from 'date-fns'

type ScenarioType = 'buy_property' | 'rate_rise' | 'reduce_income' | 'lump_sum' | 'sell_property'

const SCENARIOS: { type: ScenarioType; label: string; desc: string; emoji: string }[] = [
  { type: 'buy_property', label: 'Buy a Property', desc: 'Impact on LVR, cash flow and net worth', emoji: '🏠' },
  { type: 'rate_rise', label: 'Interest Rate Rise', desc: 'Repayment impact across all properties', emoji: '📈' },
  { type: 'reduce_income', label: 'Reduce Income', desc: 'Cash flow runway under reduced earnings', emoji: '💼' },
  { type: 'lump_sum', label: 'Invest Lump Sum', desc: 'Compound growth over time', emoji: '💰' },
  { type: 'sell_property', label: 'Sell a Property', desc: 'Equity released and portfolio impact', emoji: '🔑' },
]

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}

function BeforeAfter({ label, before, after, format = 'currency' }: {
  label: string; before: number; after: number; format?: 'currency' | 'percent'
}) {
  const delta = after - before
  const fmt = (v: number) => format === 'percent' ? `${v.toFixed(1)}%` : formatCurrency(v)
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-gray-400 uppercase tracking-wide">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500 dark:text-gray-400">{fmt(before)}</span>
        <span className="text-gray-300">→</span>
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{fmt(after)}</span>
        <span className={clsx('text-xs font-medium', delta > 0 ? 'text-green-600 dark:text-green-400' : delta < 0 ? 'text-red-500' : 'text-gray-400')}>
          {delta > 0 ? '+' : ''}{fmt(delta)}
        </span>
      </div>
    </div>
  )
}

export function SimulatePage() {
  const properties = useProperties()
  const assets = useAssets()
  const liabilities = useLiabilities()
  const transactions = useAllTransactions()

  const [selected, setSelected] = useState<ScenarioType>('buy_property')

  // Derived values
  const now = useMemo(() => new Date(), [])
  const currentNetWorth = useMemo(() => {
    const totalAssets = assets.reduce((s, a) => s + a.value, 0) + properties.reduce((s, p) => s + p.currentValue, 0)
    const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0) + properties.reduce((s, p) => s + p.loanAmount, 0)
    return totalAssets - totalLiabilities
  }, [assets, liabilities, properties])

  const { avgIncome, avgExpenses, avgMonthlySavings } = useMemo(() => {
    const cutoff = subMonths(now, 3)
    const recent = transactions.filter(t => isBefore(cutoff, toDate(t.date)))
    const income = recent.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 3
    const expenses = Math.abs(recent.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)) / 3
    return { avgIncome: income, avgExpenses: expenses, avgMonthlySavings: Math.max(0, income - expenses) }
  }, [transactions, now])

  const annualExpenses = avgExpenses * 12

  // Buy property state
  const [buyPrice, setBuyPrice] = useState('')
  const [buyDeposit, setBuyDeposit] = useState('')
  const [buyRate, setBuyRate] = useState('6.24')
  const [buyRent, setBuyRent] = useState('')

  // Rate rise state
  const [risePercent, setRisePercent] = useState(0.5)

  // Reduce income state
  const [incomeReduction, setIncomeReduction] = useState(20)

  // Lump sum state
  const [lumpAmount, setLumpAmount] = useState('')
  const [lumpReturn, setLumpReturn] = useState(7)
  const [lumpYears, setLumpYears] = useState(10)

  // Sell property state
  const [sellPropertyId, setSellPropertyId] = useState<number | null>(properties[0]?.id ?? null)
  const [sellPrice, setSellPrice] = useState('')

  // ─── Results ─────────────────────────────────────────────────────────────

  // Buy property result
  const buyResult = useMemo(() => {
    const price = parseFloat(buyPrice)
    const deposit = parseFloat(buyDeposit)
    if (!price || !deposit) return null
    return simulateBuyProperty({
      price,
      deposit,
      rate: parseFloat(buyRate) || 6.24,
      weeklyRent: parseFloat(buyRent) || 0,
      annualExpenses,
      currentNetWorth,
      annualReturn: 7,
      monthlySavings: avgMonthlySavings,
    })
  }, [buyPrice, buyDeposit, buyRate, buyRent, annualExpenses, currentNetWorth, avgMonthlySavings])

  // Rate rise result
  const rateRiseResults = useMemo(() =>
    simulateRateRise(properties, risePercent),
    [properties, risePercent])

  const totalRepaymentBefore = rateRiseResults.reduce((s, r) => s + r.before, 0)
  const totalRepaymentAfter = rateRiseResults.reduce((s, r) => s + r.after, 0)

  // Income reduction result
  const reducedIncome = avgIncome * (1 - incomeReduction / 100)
  const monthlyNetAfterReduction = reducedIncome - avgExpenses
  const cashRunway = monthlyNetAfterReduction < 0
    ? Math.abs(currentNetWorth / monthlyNetAfterReduction)
    : Infinity

  // Lump sum result
  const lumpResult = useMemo(() => {
    const amount = parseFloat(lumpAmount)
    if (!amount) return null
    return simulateLumpSum(amount, lumpReturn, lumpYears)
  }, [lumpAmount, lumpReturn, lumpYears])

  // Sell property result
  const sellProperty = properties.find(p => p.id === sellPropertyId)
  const sellValue = parseFloat(sellPrice) || sellProperty?.currentValue || 0
  const sellEquityReleased = sellProperty ? Math.max(0, sellValue - sellProperty.loanAmount) : 0
  const sellCashFlowImpact = sellProperty
    ? -calcPropertyMetrics(sellProperty).monthlyCashFlow
    : 0

  // FIRE impact helper
  function formatYears(y: number): string {
    if (y === Infinity) return '—'
    const years = Math.floor(y)
    const months = Math.round((y - years) * 12)
    return months > 0 ? `${years}y ${months}m` : `${years}y`
  }
  const fireImpact = buyResult?.fireImpact ?? 0

  return (
    <div className="space-y-6">
      {/* Scenario picker */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {SCENARIOS.map(s => (
          <button key={s.type} onClick={() => setSelected(s.type)}
            className={clsx(
              'p-3 rounded-xl text-left transition-all border',
              selected === s.type
                ? 'bg-brand text-white border-brand'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-brand hover:text-brand'
            )}>
            <div className="text-xl mb-1">{s.emoji}</div>
            <p className="text-xs font-semibold">{s.label}</p>
            <p className={clsx('text-[10px] mt-0.5', selected === s.type ? 'text-white/70' : 'text-gray-400')}>{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Buy a property */}
      {selected === 'buy_property' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Property Details</p>
            <div className="space-y-3">
              <Input label="Purchase Price ($)" type="number" placeholder="800000" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} />
              <Input label="Deposit ($)" type="number" placeholder="160000" value={buyDeposit} onChange={e => setBuyDeposit(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Interest Rate (% p.a.)" type="number" placeholder="6.24" value={buyRate} onChange={e => setBuyRate(e.target.value)} />
                <Input label="Weekly Rent ($)" type="number" placeholder="650" value={buyRent} onChange={e => setBuyRent(e.target.value)} />
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Impact</p>
            {buyResult ? (
              <div className="space-y-4">
                <BeforeAfter label="LVR" before={0} after={buyResult.newLVR} format="percent" />
                <BeforeAfter label="Monthly Cash Flow (this property)" before={0} after={buyResult.newMonthlyCashFlow} />
                <BeforeAfter label="Net Worth" before={currentNetWorth} after={currentNetWorth + buyResult.netWorthChange} />
                <div className={clsx('mt-3 p-3 rounded-xl text-sm', fireImpact <= 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300')}>
                  FIRE date {fireImpact <= 0 ? `moves closer by ${formatYears(Math.abs(fireImpact))}` : `shifts out by ${formatYears(fireImpact)}`}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Enter price and deposit to see impact</p>
            )}
          </Card>
        </div>
      )}

      {/* Interest rate rise */}
      {selected === 'rate_rise' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rate Increase</p>
              <span className="text-xl font-bold text-red-500">+{risePercent.toFixed(2)}%</span>
            </div>
            <input type="range" min={0.25} max={3} step={0.25} value={risePercent}
              onChange={e => setRisePercent(parseFloat(e.target.value))}
              className="w-full accent-brand" />
          </Card>
          {properties.length === 0 ? (
            <Card><p className="text-sm text-gray-400">Add properties to see rate rise impact.</p></Card>
          ) : (
            <>
              {properties.map((p, i) => {
                const r = rateRiseResults[i]
                if (!r) return null
                return (
                  <Card key={p.id}>
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-3">{p.nickname}</p>
                    <BeforeAfter label="Monthly Repayment" before={r.before} after={r.after} />
                  </Card>
                )
              })}
              <Card>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Portfolio Total</p>
                <BeforeAfter label="Total Monthly Repayments" before={totalRepaymentBefore} after={totalRepaymentAfter} />
                <p className="text-xs text-gray-400 mt-3">Additional annual cost: {formatCurrency((totalRepaymentAfter - totalRepaymentBefore) * 12)}</p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Reduce income */}
      {selected === 'reduce_income' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Income Reduction</p>
              <span className="text-xl font-bold text-amber-600">−{incomeReduction}%</span>
            </div>
            <input type="range" min={10} max={100} step={5} value={incomeReduction}
              onChange={e => setIncomeReduction(parseInt(e.target.value))}
              className="w-full accent-brand" />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Current income</span>
                <span className="font-medium">{formatCurrency(avgIncome)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Reduced income</span>
                <span className="font-medium text-amber-600">{formatCurrency(reducedIncome)}/mo</span>
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Impact</p>
            <div className="space-y-3">
              <BeforeAfter label="Monthly Net" before={avgIncome - avgExpenses} after={monthlyNetAfterReduction} />
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Cash Runway</p>
                <p className={clsx('text-2xl font-bold mt-1',
                  cashRunway === Infinity ? 'text-green-600 dark:text-green-400' :
                    cashRunway > 12 ? 'text-amber-600' : 'text-red-500')}>
                  {cashRunway === Infinity ? 'Sustainable' : `${cashRunway.toFixed(1)} months`}
                </p>
                {cashRunway !== Infinity && (
                  <p className="text-xs text-gray-400 mt-0.5">at {formatCurrency(Math.abs(monthlyNetAfterReduction))} deficit/mo</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Lump sum investment */}
      {selected === 'lump_sum' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Investment Details</p>
            <div className="space-y-4">
              <Input label="Lump Sum ($)" type="number" placeholder="50000" value={lumpAmount} onChange={e => setLumpAmount(e.target.value)} />
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Annual Return: <strong>{lumpReturn}%</strong></label>
                <input type="range" min={3} max={15} step={0.5} value={lumpReturn}
                  onChange={e => setLumpReturn(parseFloat(e.target.value))} className="w-full accent-brand" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Time Horizon: <strong>{lumpYears} years</strong></label>
                <input type="range" min={1} max={30} value={lumpYears}
                  onChange={e => setLumpYears(parseInt(e.target.value))} className="w-full accent-brand" />
              </div>
            </div>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Projected Growth</p>
            {lumpResult !== null && parseFloat(lumpAmount) > 0 ? (
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Starting Value</p>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-1">{formatCurrency(parseFloat(lumpAmount))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Value in {lumpYears} Years</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(lumpResult)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Total Gain</p>
                  <p className="text-xl font-bold text-brand mt-1">{formatCurrency(lumpResult - parseFloat(lumpAmount))}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {((lumpResult / parseFloat(lumpAmount) - 1) * 100).toFixed(1)}% total return
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Enter amount to see projection</p>
            )}
          </Card>
        </div>
      )}

      {/* Sell a property */}
      {selected === 'sell_property' && (
        <div className="space-y-4">
          {properties.length === 0 ? (
            <Card><p className="text-sm text-gray-400">No properties to simulate selling.</p></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Which property?</p>
                <div className="space-y-2">
                  {properties.map(p => (
                    <button key={p.id} onClick={() => setSellPropertyId(p.id!)}
                      className={clsx('w-full text-left px-4 py-3 rounded-xl border transition-all',
                        sellPropertyId === p.id
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-gray-200 dark:border-slate-700 hover:border-brand'
                      )}>
                      <p className="text-sm font-medium">{p.nickname}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(p.currentValue)} · LVR {calcPropertyMetrics(p).lvr.toFixed(1)}%</p>
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <Input label="Assumed Sale Price ($)" type="number"
                    placeholder={sellProperty ? String(sellProperty.currentValue) : ''}
                    value={sellPrice} onChange={e => setSellPrice(e.target.value)} />
                </div>
              </Card>
              {sellProperty && (
                <Card>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Impact of Selling</p>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Equity Released</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(sellEquityReleased)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(sellValue)} − {formatCurrency(sellProperty.loanAmount)} loan</p>
                    </div>
                    <BeforeAfter label="Net Worth" before={currentNetWorth} after={currentNetWorth + sellEquityReleased - sellProperty.currentValue + sellValue} />
                    <div>
                      <p className="text-[11px] text-gray-400 uppercase tracking-wide">Portfolio Cash Flow Change</p>
                      <p className={clsx('text-lg font-bold mt-1', sellCashFlowImpact >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                        {sellCashFlowImpact >= 0 ? '+' : ''}{formatCurrency(sellCashFlowImpact)}/mo
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
