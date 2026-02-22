import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, Trash2, TrendingUp, TrendingDown, Check } from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine,
  PieChart, Pie, Cell
} from 'recharts'
import { useAssets, addAsset, updateAsset, deleteAsset } from '@/hooks/useAssets'
import { useLiabilities, addLiability, updateLiability, deleteLiability } from '@/hooks/useLiabilities'
import { useNetWorthSnapshots, saveSnapshot } from '@/hooks/useNetWorthSnapshots'
import { useProperties } from '@/hooks/useProperties'
import { formatCurrency, formatShortCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AssetType, LiabilityType } from '@/types'
import { clsx } from 'clsx'

const ASSET_TYPES: { value: AssetType; label: string; color: string }[] = [
  { value: 'cash', label: 'Cash & Savings', color: '#22c55e' },
  { value: 'offset', label: 'Offset Account', color: '#16a34a' },
  { value: 'shares', label: 'Shares / ETFs', color: '#3b82f6' },
  { value: 'super', label: 'Super', color: '#8b5cf6' },
  { value: 'property', label: 'Property', color: '#f97316' },
  { value: 'crypto', label: 'Crypto', color: '#eab308' },
  { value: 'business', label: 'Business Equity', color: '#ec4899' },
  { value: 'other', label: 'Other', color: '#6b7280' },
]

const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'hecs', label: 'HECS / Student Loan' },
  { value: 'personal_loan', label: 'Personal Loan' },
  { value: 'car_loan', label: 'Car Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
]

function assetTypeLabel(t: AssetType) {
  return ASSET_TYPES.find(x => x.value === t)?.label ?? t
}
function assetTypeColor(t: AssetType) {
  return ASSET_TYPES.find(x => x.value === t)?.color ?? '#6b7280'
}
interface AddAssetForm {
  name: string
  type: AssetType
  value: string
  notes: string
}

interface AddLiabilityForm {
  name: string
  type: LiabilityType
  balance: string
  interestRate: string
  minPayment: string
  notes: string
}

function RingProgress({ pct, size = 80, color = '#f97316' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.min(1, Math.max(0, pct / 100)) * circ
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={7} className="dark:stroke-slate-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  )
}

// ── Pre-built templates so users just type numbers ──────────────────
const ASSET_TEMPLATES: { name: string; type: AssetType }[] = [
  { name: 'Everyday Account', type: 'cash' },
  { name: 'Savings Account', type: 'cash' },
  { name: 'Offset Account', type: 'offset' },
  { name: 'Shares / ETFs', type: 'shares' },
  { name: 'Superannuation', type: 'super' },
  { name: 'Crypto', type: 'crypto' },
  { name: 'Car Value', type: 'other' },
]

const LIABILITY_TEMPLATES: { name: string; type: LiabilityType; rate?: number }[] = [
  { name: 'HECS / HELP Debt', type: 'hecs' },
  { name: 'Credit Card', type: 'credit_card', rate: 20 },
  { name: 'Car Loan', type: 'car_loan', rate: 7 },
  { name: 'Personal Loan', type: 'personal_loan', rate: 10 },
  { name: 'Buy Now Pay Later', type: 'other' },
]

function QuickFillRow({ label, color, placeholder, existing, onSave, onDelete }: {
  label: string
  color: string
  placeholder?: string
  existing?: { id?: number; value: number }
  onSave: (value: number) => void
  onDelete?: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState('')

  const handleSave = useCallback(() => {
    const num = parseFloat(inputVal)
    if (!isNaN(num) && num > 0) {
      onSave(num)
      setEditing(false)
    }
  }, [inputVal, onSave])

  if (existing && !editing) {
    return (
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl px-4 py-3 border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => { setInputVal(String(existing.value)); setEditing(true) }}
            className="text-sm font-semibold text-green-600 dark:text-green-400 hover:underline">
            {formatCurrency(existing.value)}
          </button>
          {onDelete && (
            <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl px-4 py-2.5 border border-gray-100 dark:border-slate-700">
      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-sm text-gray-500 dark:text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 flex items-center gap-2 justify-end">
        <span className="text-sm text-gray-400">$</span>
        <input
          type="number"
          placeholder={placeholder ?? '0'}
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className="w-28 text-right text-sm bg-transparent border-b border-gray-200 dark:border-slate-600 py-1 text-gray-800 dark:text-gray-200 focus:outline-none focus:border-orange-400 placeholder:text-gray-300 dark:placeholder:text-slate-600"
          autoFocus={editing}
        />
        <button onClick={handleSave}
          className="p-1 rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          title="Save">
          <Check size={16} />
        </button>
      </div>
    </div>
  )
}

export function NetWorthPage() {
  const assets = useAssets()
  const liabilities = useLiabilities()
  const snapshots = useNetWorthSnapshots()
  const properties = useProperties()

  const [showAssetModal, setShowAssetModal] = useState(false)
  const [showLiabilityModal, setShowLiabilityModal] = useState(false)
  const [assetForm, setAssetForm] = useState<AddAssetForm>({ name: '', type: 'cash', value: '', notes: '' })
  const [liabilityForm, setLiabilityForm] = useState<AddLiabilityForm>({ name: '', type: 'mortgage', balance: '', interestRate: '', minPayment: '', notes: '' })

  // Property-derived values
  const propertyAssetValue = useMemo(() =>
    properties.reduce((s, p) => s + p.currentValue, 0), [properties])
  const mortgageLiabilityValue = useMemo(() =>
    properties.reduce((s, p) => s + p.loanAmount, 0), [properties])

  const totalManualAssets = useMemo(() => assets.reduce((s, a) => s + a.value, 0), [assets])
  const totalAssets = totalManualAssets + propertyAssetValue
  const totalManualLiabilities = useMemo(() => liabilities.reduce((s, l) => s + l.balance, 0), [liabilities])
  const totalLiabilities = totalManualLiabilities + mortgageLiabilityValue
  const netWorth = totalAssets - totalLiabilities

  // Save monthly snapshot on page visit
  useEffect(() => {
    if (totalAssets > 0 || totalLiabilities > 0) {
      saveSnapshot(totalAssets, totalLiabilities)
    }
  }, [totalAssets, totalLiabilities])

  // Previous month delta
  const prevSnapshot = snapshots.length >= 2 ? snapshots[snapshots.length - 2] : null
  const delta = prevSnapshot ? netWorth - prevSnapshot.netWorth : null

  // Chart data
  const chartData = useMemo(() =>
    snapshots.map(s => ({
      label: new Date(s.date).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
      netWorth: s.netWorth,
    })),
    [snapshots])

  // Donut data (manual + property)
  const donutData = useMemo(() => {
    const grouped: Record<string, number> = {}
    for (const a of assets) {
      grouped[a.type] = (grouped[a.type] ?? 0) + a.value
    }
    if (propertyAssetValue > 0) grouped['property'] = (grouped['property'] ?? 0) + propertyAssetValue
    return Object.entries(grouped).map(([type, value]) => ({
      name: assetTypeLabel(type as AssetType),
      value,
      color: assetTypeColor(type as AssetType),
    }))
  }, [assets, propertyAssetValue])

  async function handleAddAsset() {
    if (!assetForm.name || !assetForm.value) return
    await addAsset({
      name: assetForm.name,
      type: assetForm.type,
      value: parseFloat(assetForm.value),
      notes: assetForm.notes || undefined,
      updatedAt: new Date(),
    })
    setAssetForm({ name: '', type: 'cash', value: '', notes: '' })
    setShowAssetModal(false)
  }

  async function handleAddLiability() {
    if (!liabilityForm.name || !liabilityForm.balance) return
    await addLiability({
      name: liabilityForm.name,
      type: liabilityForm.type,
      balance: parseFloat(liabilityForm.balance),
      interestRate: liabilityForm.interestRate ? parseFloat(liabilityForm.interestRate) : undefined,
      minPayment: liabilityForm.minPayment ? parseFloat(liabilityForm.minPayment) : undefined,
      notes: liabilityForm.notes || undefined,
      updatedAt: new Date(),
    })
    setLiabilityForm({ name: '', type: 'mortgage', balance: '', interestRate: '', minPayment: '', notes: '' })
    setShowLiabilityModal(false)
  }

  const netWorthColor = netWorth >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Net Worth</p>
              <p className={clsx('text-3xl font-bold mt-1', netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                {netWorth < 0 ? '-' : ''}{formatCurrency(Math.abs(netWorth))}
              </p>
              {delta !== null && (
                <p className={clsx('text-xs mt-1 flex items-center gap-1', delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
                  {delta >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {delta >= 0 ? '+' : ''}{formatCurrency(Math.abs(delta))} vs last month
                </p>
              )}
            </div>
            <div className="relative">
              <RingProgress pct={totalAssets > 0 ? (netWorth / totalAssets) * 100 : 0} size={72} color={netWorthColor} />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700 dark:text-gray-300">
                {totalAssets > 0 ? Math.round((netWorth / totalAssets) * 100) : 0}%
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Assets</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalAssets)}</p>
          {propertyAssetValue > 0 && (
            <p className="text-[11px] text-gray-400 mt-1">incl. {formatCurrency(propertyAssetValue)} properties</p>
          )}
        </Card>
        <Card>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total Liabilities</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{formatCurrency(totalLiabilities)}</p>
          {mortgageLiabilityValue > 0 && (
            <p className="text-[11px] text-gray-400 mt-1">incl. {formatCurrency(mortgageLiabilityValue)} mortgages</p>
          )}
        </Card>
      </div>

      {/* Chart + Donut */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Net Worth Over Time</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => formatShortCurrency(v)} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
                <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="netWorth" stroke="#f97316" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          {donutData.length > 0 && (
            <Card>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Asset Allocation</p>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={60}>
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => formatCurrency(v as number)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1">
                {donutData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600 dark:text-gray-400">{d.name}</span>
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{formatShortCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Assets + Liabilities columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Assets</h2>
            <Button size="sm" onClick={() => setShowAssetModal(true)}>
              <Plus size={14} className="mr-1" /> Custom Asset
            </Button>
          </div>
          <p className="text-xs text-gray-400">Fill in what applies — leave the rest blank</p>
          {properties.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-3 space-y-2">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">From Properties</p>
              {properties.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{p.nickname}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{formatCurrency(p.currentValue)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {ASSET_TEMPLATES.map(tmpl => {
              const match = assets.find(a => a.name === tmpl.name)
              return (
                <QuickFillRow
                  key={tmpl.name}
                  label={tmpl.name}
                  color={assetTypeColor(tmpl.type)}
                  existing={match ? { id: match.id, value: match.value } : undefined}
                  onSave={async (value) => {
                    if (match?.id) {
                      await updateAsset(match.id, { value })
                    } else {
                      await addAsset({ name: tmpl.name, type: tmpl.type, value, updatedAt: new Date() })
                    }
                  }}
                  onDelete={match?.id ? () => deleteAsset(match.id!) : undefined}
                />
              )
            })}
            {/* Custom assets that don't match templates */}
            {assets.filter(a => !ASSET_TEMPLATES.some(t => t.name === a.name)).map(asset => (
              <QuickFillRow
                key={asset.id}
                label={asset.name}
                color={assetTypeColor(asset.type)}
                existing={{ id: asset.id, value: asset.value }}
                onSave={async (value) => { if (asset.id) await updateAsset(asset.id, { value }) }}
                onDelete={asset.id ? () => deleteAsset(asset.id!) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Liabilities */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Liabilities</h2>
            <Button size="sm" variant="secondary" onClick={() => setShowLiabilityModal(true)}>
              <Plus size={14} className="mr-1" /> Custom Liability
            </Button>
          </div>
          <p className="text-xs text-gray-400">Fill in what applies — leave the rest blank</p>
          {properties.length > 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 dark:border-slate-700 p-3 space-y-2">
              <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">From Properties</p>
              {properties.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{p.nickname} mortgage</span>
                  <span className="font-medium text-red-500">{formatCurrency(p.loanAmount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2">
            {LIABILITY_TEMPLATES.map(tmpl => {
              const match = liabilities.find(l => l.name === tmpl.name)
              return (
                <QuickFillRow
                  key={tmpl.name}
                  label={tmpl.name}
                  color="#ef4444"
                  existing={match ? { id: match.id, value: match.balance } : undefined}
                  onSave={async (value) => {
                    if (match?.id) {
                      await updateLiability(match.id, { balance: value })
                    } else {
                      await addLiability({
                        name: tmpl.name,
                        type: tmpl.type,
                        balance: value,
                        interestRate: tmpl.rate,
                        updatedAt: new Date(),
                      })
                    }
                  }}
                  onDelete={match?.id ? () => deleteLiability(match.id!) : undefined}
                />
              )
            })}
            {/* Custom liabilities that don't match templates */}
            {liabilities.filter(l => !LIABILITY_TEMPLATES.some(t => t.name === l.name)).map(liability => (
              <QuickFillRow
                key={liability.id}
                label={liability.name}
                color="#ef4444"
                existing={{ id: liability.id, value: liability.balance }}
                onSave={async (value) => { if (liability.id) await updateLiability(liability.id, { balance: value }) }}
                onDelete={liability.id ? () => deleteLiability(liability.id!) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      <Modal open={showAssetModal} onClose={() => setShowAssetModal(false)} title="Add Asset">
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g. High-interest savings" value={assetForm.name}
            onChange={e => setAssetForm(f => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <select value={assetForm.type} onChange={e => setAssetForm(f => ({ ...f, type: e.target.value as AssetType }))}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30">
              {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Value ($)" type="number" placeholder="50000" value={assetForm.value}
            onChange={e => setAssetForm(f => ({ ...f, value: e.target.value }))} />
          <Input label="Notes (optional)" placeholder="Any extra details" value={assetForm.notes}
            onChange={e => setAssetForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddAsset} className="flex-1">Add Asset</Button>
            <Button variant="secondary" onClick={() => setShowAssetModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add Liability Modal */}
      <Modal open={showLiabilityModal} onClose={() => setShowLiabilityModal(false)} title="Add Liability">
        <div className="space-y-4">
          <Input label="Name" placeholder="e.g. HECS debt" value={liabilityForm.name}
            onChange={e => setLiabilityForm(f => ({ ...f, name: e.target.value }))} />
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
            <select value={liabilityForm.type} onChange={e => setLiabilityForm(f => ({ ...f, type: e.target.value as LiabilityType }))}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30">
              {LIABILITY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Input label="Balance ($)" type="number" placeholder="25000" value={liabilityForm.balance}
            onChange={e => setLiabilityForm(f => ({ ...f, balance: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Interest Rate (% p.a.)" type="number" placeholder="6.5" value={liabilityForm.interestRate}
              onChange={e => setLiabilityForm(f => ({ ...f, interestRate: e.target.value }))} />
            <Input label="Min Payment ($/mo)" type="number" placeholder="300" value={liabilityForm.minPayment}
              onChange={e => setLiabilityForm(f => ({ ...f, minPayment: e.target.value }))} />
          </div>
          <Input label="Notes (optional)" placeholder="" value={liabilityForm.notes}
            onChange={e => setLiabilityForm(f => ({ ...f, notes: e.target.value }))} />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleAddLiability} className="flex-1">Add Liability</Button>
            <Button variant="secondary" onClick={() => setShowLiabilityModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
