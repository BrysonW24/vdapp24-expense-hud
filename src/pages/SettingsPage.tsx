import { useState } from 'react'
import { Sun, Moon, Monitor, Download, Trash2, Database, LogOut, User } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useImportBatches } from '@/hooks/useImportBatches'
import { db } from '@/db/database'
import { formatDate } from '@/lib/formatters'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { clsx } from 'clsx'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const transactions = useAllTransactions()
  const categories = useCategories()
  const batches = useImportBatches()
  const [clearing, setClearing] = useState(false)

  const exportData = () => {
    const data = { transactions, categories, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `expense-hud-backup-${formatDate(new Date(), 'yyyy-MM-dd')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    const header = 'Date,Description,Amount,Category,Account,Notes\n'
    const rows = transactions.map(tx => {
      const cat = categories.find(c => c.id === tx.categoryId)
      return `"${formatDate(tx.date)}","${tx.description}",${tx.amount},"${cat?.name ?? ''}","${tx.bankAccount}","${tx.notes ?? ''}"`
    }).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAllData = async () => {
    if (!confirm('This will permanently delete ALL transactions, imports, and budgets. Categories will be reset to defaults. This cannot be undone.\n\nAre you sure?')) return
    setClearing(true)
    await db.transactions.clear()
    await db.importBatches.clear()
    await db.budgets.clear()
    setClearing(false)
  }

  const THEME_OPTIONS = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ]

  return (
    <div className="space-y-4">
      {/* Account */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <User size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Account</p>
        </div>
        {user ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.email}</p>
              <p className="text-xs text-gray-400">Signed in · data syncs to cloud</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              <LogOut size={14} /> Sign Out
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Offline mode · data stored locally only</p>
        )}
      </Card>

      {/* Stats */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Database size={16} className="text-brand" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Data Summary</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{transactions.length}</p>
            <p className="text-xs text-gray-400">Transactions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{batches.length}</p>
            <p className="text-xs text-gray-400">Imports</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
            <p className="text-xs text-gray-400">Categories</p>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Appearance</p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-colors',
                theme === value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 dark:border-slate-600 text-gray-500'
              )}
            >
              <Icon size={18} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Export */}
      <Card>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Export Data</p>
        <div className="space-y-2">
          <Button variant="secondary" onClick={exportCSV} className="w-full justify-start gap-3">
            <Download size={16} /> Export transactions as CSV
          </Button>
          <Button variant="secondary" onClick={exportData} className="w-full justify-start gap-3">
            <Download size={16} /> Export full backup as JSON
          </Button>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-red-200 dark:border-red-900/50">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-3">Danger Zone</p>
        <Button variant="danger" onClick={clearAllData} disabled={clearing} className="w-full">
          <Trash2 size={16} /> {clearing ? 'Clearing...' : 'Clear All Transactions'}
        </Button>
        <p className="text-xs text-gray-400 mt-2">This cannot be undone. Categories will be preserved.</p>
      </Card>

      {/* About */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">Expense HUD · vdapp24</p>
        <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Built by Vivacity Digital{user ? ' · Cloud sync enabled' : ' · All data stored locally on your device'}</p>
      </div>
    </div>
  )
}
