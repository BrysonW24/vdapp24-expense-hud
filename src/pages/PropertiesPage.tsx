import { useState } from 'react'
import { Plus, Trash2, Edit2, Home, AlertTriangle, CheckCircle } from 'lucide-react'
import { useProperties, addProperty, updateProperty, deleteProperty } from '@/hooks/useProperties'
import { calcPropertyMetrics } from '@/lib/finance'
import { formatCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Property, LoanType } from '@/types'
import { clsx } from 'clsx'

type PropertyForm = {
  nickname: string
  address: string
  purchasePrice: string
  currentValue: string
  loanAmount: string
  interestRate: string
  loanType: LoanType
  offsetBalance: string
  weeklyRent: string
  vacancyRate: string
  monthlyRunningCosts: string
  notes: string
}

const emptyForm: PropertyForm = {
  nickname: '',
  address: '',
  purchasePrice: '',
  currentValue: '',
  loanAmount: '',
  interestRate: '',
  loanType: 'p&i',
  offsetBalance: '0',
  weeklyRent: '0',
  vacancyRate: '4',
  monthlyRunningCosts: '0',
  notes: '',
}

function formToProperty(f: PropertyForm): Omit<Property, 'id'> {
  return {
    nickname: f.nickname,
    address: f.address || undefined,
    purchasePrice: parseFloat(f.purchasePrice) || 0,
    currentValue: parseFloat(f.currentValue) || 0,
    loanAmount: parseFloat(f.loanAmount) || 0,
    interestRate: parseFloat(f.interestRate) || 0,
    loanType: f.loanType,
    offsetBalance: parseFloat(f.offsetBalance) || 0,
    weeklyRent: parseFloat(f.weeklyRent) || 0,
    vacancyRate: parseFloat(f.vacancyRate) || 0,
    monthlyRunningCosts: parseFloat(f.monthlyRunningCosts) || 0,
    notes: f.notes || undefined,
  }
}

function propertyToForm(p: Property): PropertyForm {
  return {
    nickname: p.nickname,
    address: p.address ?? '',
    purchasePrice: String(p.purchasePrice),
    currentValue: String(p.currentValue),
    loanAmount: String(p.loanAmount),
    interestRate: String(p.interestRate),
    loanType: p.loanType,
    offsetBalance: String(p.offsetBalance),
    weeklyRent: String(p.weeklyRent),
    vacancyRate: String(p.vacancyRate),
    monthlyRunningCosts: String(p.monthlyRunningCosts),
    notes: p.notes ?? '',
  }
}

function LVRBadge({ value }: { value: number }) {
  const color = value >= 80 ? 'text-red-500 bg-red-50 dark:bg-red-900/20' :
    value >= 70 ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' :
      'text-green-600 bg-green-50 dark:bg-green-900/20'
  return (
    <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full', color)}>
      LVR {value.toFixed(1)}%
    </span>
  )
}

function CashFlowBadge({ value }: { value: number }) {
  if (value >= 0) {
    return <span className="text-xs font-semibold text-green-600 dark:text-green-400">+{formatCurrency(value)}/mo</span>
  }
  return <span className="text-xs font-semibold text-red-500">{formatCurrency(value)}/mo</span>
}

function PropertyModal({ isOpen, onClose, initial, title, onSave }: {
  isOpen: boolean
  onClose: () => void
  initial: PropertyForm
  title: string
  onSave: (f: PropertyForm) => void
}) {
  const [form, setForm] = useState<PropertyForm>(initial)

  // reset form when initial changes
  useState(() => { setForm(initial) })

  const f = (field: keyof PropertyForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <Modal open={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Nickname *" placeholder="PPOR" value={form.nickname} onChange={f('nickname')} />
          <Input label="Address" placeholder="123 Main St" value={form.address} onChange={f('address')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Purchase Price ($)" type="number" placeholder="800000" value={form.purchasePrice} onChange={f('purchasePrice')} />
          <Input label="Current Value ($)" type="number" placeholder="950000" value={form.currentValue} onChange={f('currentValue')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Loan Amount ($)" type="number" placeholder="600000" value={form.loanAmount} onChange={f('loanAmount')} />
          <Input label="Interest Rate (% p.a.)" type="number" placeholder="6.24" value={form.interestRate} onChange={f('interestRate')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Loan Type</label>
            <select value={form.loanType} onChange={f('loanType')}
              className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="p&i">Principal & Interest</option>
              <option value="io">Interest Only</option>
            </select>
          </div>
          <Input label="Offset Balance ($)" type="number" placeholder="50000" value={form.offsetBalance} onChange={f('offsetBalance')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Input label="Weekly Rent ($)" type="number" placeholder="650" value={form.weeklyRent} onChange={f('weeklyRent')} />
          <Input label="Vacancy Rate (%)" type="number" placeholder="4" value={form.vacancyRate} onChange={f('vacancyRate')} />
          <Input label="Running Costs ($/mo)" type="number" placeholder="500" value={form.monthlyRunningCosts} onChange={f('monthlyRunningCosts')} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
          <textarea value={form.notes} onChange={f('notes')} rows={2}
            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand/30 resize-none" />
        </div>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => { if (form.nickname && form.currentValue) onSave(form) }} className="flex-1">Save</Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </Modal>
  )
}

export function PropertiesPage() {
  const properties = useProperties()
  const [showAdd, setShowAdd] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<PropertyForm>(emptyForm)
  const [toastVisible, setToastVisible] = useState(false)

  // Portfolio-level metrics
  const portfolio = properties.map(p => ({ p, m: calcPropertyMetrics(p) }))
  const totalEquity = portfolio.reduce((s, { m }) => s + m.equity, 0)
  const totalPortfolioValue = properties.reduce((s, p) => s + p.currentValue, 0)
  const totalLoanAmount = properties.reduce((s, p) => s + p.loanAmount, 0)
  const blendedLVR = totalPortfolioValue > 0 ? (totalLoanAmount / totalPortfolioValue) * 100 : 0
  const totalMonthlyCashFlow = portfolio.reduce((s, { m }) => s + m.monthlyCashFlow, 0)
  const usableEquity = portfolio.reduce((s, { p }) => {
    const maxBorrow = p.currentValue * 0.8 - p.loanAmount
    return s + Math.max(0, maxBorrow)
  }, 0)
  const isReady = usableEquity > 0 && totalMonthlyCashFlow >= 0

  function showComingSoon() {
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  async function handleAdd(f: PropertyForm) {
    await addProperty(formToProperty(f))
    setShowAdd(false)
  }

  async function handleEdit(f: PropertyForm) {
    if (editId == null) return
    await updateProperty(editId, formToProperty(f))
    setEditId(null)
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastVisible && (
        <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          Domain API estimate coming soon
        </div>
      )}

      {/* Portfolio summary */}
      {properties.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Total Equity</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalEquity)}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{formatCurrency(usableEquity)} usable at 80%</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Blended LVR</p>
            <p className={clsx('text-2xl font-bold mt-1', blendedLVR >= 80 ? 'text-red-500' : blendedLVR >= 70 ? 'text-amber-600' : 'text-green-600 dark:text-green-400')}>
              {blendedLVR.toFixed(1)}%
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{properties.length} {properties.length === 1 ? 'property' : 'properties'}</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Monthly Cash Flow</p>
            <p className={clsx('text-2xl font-bold mt-1', totalMonthlyCashFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500')}>
              {totalMonthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(totalMonthlyCashFlow)}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">across all properties</p>
          </Card>
          <Card>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">Next Property Ready?</p>
            <div className="flex items-center gap-2 mt-2">
              {isReady
                ? <><CheckCircle size={20} className="text-green-500" /><span className="text-sm font-semibold text-green-600 dark:text-green-400">Yes</span></>
                : <><AlertTriangle size={20} className="text-amber-500" /><span className="text-sm font-semibold text-amber-600">Not yet</span></>
              }
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              {isReady ? `${formatCurrency(usableEquity)} usable equity + positive cash flow` : 'Need usable equity + neutral/positive cash flow'}
            </p>
          </Card>
        </div>
      )}

      {/* Property cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Portfolio</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} className="mr-1" /> Add Property
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="text-center py-12">
          <Home size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No properties yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your PPOR or an investment property to track equity, cash flow and yield.</p>
          <Button className="mt-4" onClick={() => setShowAdd(true)}>Add First Property</Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {portfolio.map(({ p, m }) => (
            <Card key={p.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Home size={16} className="text-brand" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{p.nickname}</h3>
                    <LVRBadge value={m.lvr} />
                  </div>
                  {p.address && <p className="text-xs text-gray-400 mt-0.5 ml-6">{p.address}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={showComingSoon}
                    className="text-xs text-blue-500 border border-blue-200 dark:border-blue-700 rounded-lg px-2 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                    Refresh estimate
                  </button>
                  <button onClick={() => { setEditId(p.id!); setEditForm(propertyToForm(p)) }}
                    className="text-gray-400 hover:text-brand transition-colors">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => p.id && deleteProperty(p.id)}
                    className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Value</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(p.currentValue)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Equity</p>
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(m.equity)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Loan</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(p.loanAmount)}</p>
                  <p className="text-[10px] text-gray-400">{p.loanType.toUpperCase()} {p.interestRate}%</p>
                </div>
                {p.offsetBalance > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Offset</p>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(p.offsetBalance)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Cash Flow</p>
                  <CashFlowBadge value={m.monthlyCashFlow} />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Gross Yield</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{m.grossYield.toFixed(2)}%</p>
                  <p className="text-[10px] text-gray-400">net {m.netYield.toFixed(2)}%</p>
                </div>
              </div>

              {/* Repayment hint */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Repayment: {formatCurrency(m.monthlyRepayment)}/mo</span>
                {p.weeklyRent > 0 && <span>Weekly rent: {formatCurrency(p.weeklyRent)}/wk</span>}
                {p.vacancyRate > 0 && <span>Vacancy: {p.vacancyRate}%</span>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add modal */}
      <PropertyModal
        key="add"
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        initial={emptyForm}
        title="Add Property"
        onSave={handleAdd}
      />

      {/* Edit modal */}
      <PropertyModal
        key={`edit-${editId}`}
        isOpen={editId != null}
        onClose={() => setEditId(null)}
        initial={editForm}
        title="Edit Property"
        onSave={handleEdit}
      />
    </div>
  )
}
