import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCategories, addCategory, updateCategory, deleteCategory } from '@/hooks/useCategories'
import { useAllTransactions } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { Category } from '@/types'
import { clsx } from 'clsx'

const CATEGORY_COLORS = ['#22c55e','#ef4444','#3b82f6','#f97316','#8b5cf6','#06b6d4','#eab308','#ec4899','#14b8a6','#FF6B35','#64748b','#a855f7']
const CATEGORY_TYPES = ['expense', 'income', 'transfer'] as const

type CategoryFormData = {
  name: string
  color: string
  type: 'expense' | 'income' | 'transfer'
  budget: string
  keywords: string
}

const defaultForm: CategoryFormData = { name: '', color: '#FF6B35', type: 'expense', budget: '', keywords: '' }

export function CategoriesPage() {
  const categories = useCategories()
  const transactions = useAllTransactions()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<CategoryFormData>(defaultForm)
  const [activeType, setActiveType] = useState<'expense' | 'income' | 'transfer'>('expense')

  const spendByCategory = transactions.reduce<Record<number, number>>((acc, tx) => {
    if (tx.amount < 0) acc[tx.categoryId] = (acc[tx.categoryId] ?? 0) + Math.abs(tx.amount)
    return acc
  }, {})

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingId(cat.id!)
    setForm({ name: cat.name, color: cat.color, type: cat.type, budget: cat.budget?.toString() ?? '', keywords: cat.keywords.join(', ') })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const data: Omit<Category, 'id'> = {
      name: form.name.trim(),
      color: form.color,
      type: form.type,
      icon: 'tag',
      budget: form.budget ? parseFloat(form.budget) : undefined,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      isDefault: false,
      sortOrder: 50,
    }
    if (editingId) await updateCategory(editingId, data)
    else await addCategory(data)
    setModalOpen(false)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this category? Transactions will be moved to Uncategorised.')) {
      await deleteCategory(id)
    }
  }

  const filtered = categories.filter(c => c.type === activeType)

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {CATEGORY_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={clsx(
              'flex-1 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              activeType === t ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
            )}
          >{t}</button>
        ))}
      </div>

      <Button onClick={openAdd} className="w-full"><Plus size={16} /> Add Category</Button>

      <div className="space-y-2">
        {filtered.map(cat => {
          const spent = spendByCategory[cat.id!] ?? 0
          const budgetPct = cat.budget && spent ? Math.min((spent / cat.budget) * 100, 100) : 0
          return (
            <Card key={cat.id}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: cat.color + '22' }}>
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</p>
                    {cat.type === 'expense' && <p className="text-sm font-semibold text-red-500">{spent > 0 ? `-${formatCurrency(spent)}` : '—'}</p>}
                  </div>
                  {cat.budget && (
                    <div className="mt-1">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                        <span>{formatCurrency(spent)} / {formatCurrency(cat.budget)} budget</span>
                        <span>{budgetPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1 bg-gray-100 dark:bg-slate-700 rounded-full">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${budgetPct}%`, backgroundColor: budgetPct >= 100 ? '#ef4444' : cat.color }} />
                      </div>
                    </div>
                  )}
                  {cat.keywords.length > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">{cat.keywords.join(' · ')}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"><Pencil size={13} /></button>
                  {!cat.isDefault && <button onClick={() => handleDelete(cat.id!)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Category' : 'Add Category'}>
        <div className="space-y-4">
          <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Coffee" />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Type</label>
            <div className="flex gap-2">
              {CATEGORY_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))} className={clsx('flex-1 py-1.5 rounded-xl text-sm font-medium capitalize border transition-colors', form.type === t ? 'bg-brand text-white border-brand' : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400')}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Colour</label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORY_COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))} className={clsx('w-7 h-7 rounded-full border-2 transition-transform', form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent')} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <Input label="Monthly Budget (optional, AUD)" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="e.g. 500" />
          <Input label="Auto-match keywords (comma-separated)" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="e.g. coffee, cafe, starbucks" />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()} className="flex-1">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
