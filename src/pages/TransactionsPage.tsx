import { useState, useMemo } from 'react'
import { Search, Pencil, Trash2, Check, X, List } from 'lucide-react'
import { clsx } from 'clsx'
import { useTransactions, updateTransaction, deleteTransaction } from '@/hooks/useTransactions'
import { useCategories, useCategoryMap } from '@/hooks/useCategories'

function toDate(d: Date | string | number): Date {
  return d instanceof Date ? d : new Date(d)
}
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'

export function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [amountFilter, setAmountFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editCategory, setEditCategory] = useState<number>(0)
  const [editNotes, setEditNotes] = useState('')

  const allTransactions = useTransactions()
  const categories = useCategories()
  const categoryMap = useCategoryMap()

  const filtered = useMemo(() => {
    return allTransactions.filter(tx => {
      if (search && !tx.description.toLowerCase().includes(search.toLowerCase())) return false
      if (selectedCategory && tx.categoryId !== selectedCategory) return false
      if (amountFilter === 'income' && tx.amount < 0) return false
      if (amountFilter === 'expense' && tx.amount > 0) return false
      return true
    })
  }, [allTransactions, search, selectedCategory, amountFilter])

  const startEdit = (tx: typeof allTransactions[0]) => {
    setEditingId(tx.id!)
    setEditCategory(tx.categoryId)
    setEditNotes(tx.notes ?? '')
  }

  const saveEdit = async (id: number) => {
    await updateTransaction(id, { categoryId: editCategory, notes: editNotes })
    setEditingId(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this transaction?')) await deleteTransaction(id)
  }

  const totalFiltered = filtered.reduce((s, tx) => s + tx.amount, 0)

  if (allTransactions.length === 0) {
    return <EmptyState icon={<List />} title="No transactions yet" description="Import a bank statement CSV to get started." />
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search transactions…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/50"
          />
        </div>
        <select
          value={amountFilter}
          onChange={e => setAmountFilter(e.target.value as 'all' | 'income' | 'expense')}
          className="text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none"
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expenses</option>
        </select>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
            !selectedCategory ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
          )}
        >All</button>
        {categories.filter(c => c.type !== 'transfer').map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id!)}
            className={clsx('px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0',
              selectedCategory === cat.id ? 'text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400'
            )}
            style={selectedCategory === cat.id ? { backgroundColor: cat.color } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{filtered.length} transactions</span>
        <span className={clsx('font-semibold', totalFiltered >= 0 ? 'amount-positive' : 'amount-negative')}>
          {totalFiltered >= 0 ? '+' : ''}{formatCurrency(totalFiltered)}
        </span>
      </div>

      {/* Transaction list */}
      <div className="space-y-1">
        {filtered.map(tx => {
          const cat = categoryMap[tx.categoryId]
          const isEditing = editingId === tx.id

          return (
            <div key={tx.id} className="hud-card group">
              {isEditing ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                  <div className="flex gap-2">
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(Number(e.target.value))}
                      className="flex-1 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notes…"
                      className="flex-1 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(tx.id!)} className="flex-1"><Check size={14} /> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X size={14} /></Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: (cat?.color ?? '#6b7280') + '22' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat?.color ?? '#6b7280' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDate(toDate(tx.date), 'dd MMM yyyy')}</span>
                      {cat && <Badge style={{ backgroundColor: cat.color + '22', color: cat.color }}>{cat.name}</Badge>}
                      {tx.notes && <span className="text-xs text-gray-400 truncate">{tx.notes}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={clsx('text-sm font-semibold tabular-nums', tx.amount >= 0 ? 'amount-positive' : 'amount-negative')}>
                      {tx.amount >= 0 ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <div className="hidden group-hover:flex gap-1">
                      <button onClick={() => startEdit(tx)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(tx.id!)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && allTransactions.length > 0 && (
        <EmptyState title="No matches" description="Try adjusting your search or filters." />
      )}
    </div>
  )
}
