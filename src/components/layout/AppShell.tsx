import { useState, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { Header } from './Header'
import { useTheme } from '@/hooks/useTheme'
import { useAllTransactions } from '@/hooks/useTransactions'
import { useCategoryMap } from '@/hooks/useCategories'
import { useProperties } from '@/hooks/useProperties'
import { useNetWorthSnapshots } from '@/hooks/useNetWorthSnapshots'
import { detectAlerts } from '@/lib/agentAlerts'
import type { AgentAlert } from '@/types'
import { clsx } from 'clsx'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/import': 'Import CSV',
  '/insights': 'Insights',
  '/categories': 'Categories',
  '/settings': 'Settings',
  '/networth': 'Net Worth',
  '/properties': 'Properties',
  '/forecast': 'Forecast',
  '/fire': 'FIRE Calculator',
  '/debt': 'Debt Engine',
  '/simulate': 'Decision Simulator',
  '/visualizations': 'Visualizations',
}

function AlertBanner({ alert, onDismiss }: { alert: AgentAlert; onDismiss: () => void }) {
  const icons = {
    warning: <AlertTriangle size={15} className="shrink-0" />,
    info: <Info size={15} className="shrink-0" />,
    positive: <CheckCircle size={15} className="shrink-0" />,
  }
  const colors = {
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300',
    positive: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300',
  }
  return (
    <div className={clsx('flex items-center gap-3 px-4 py-2.5 border-b text-sm', colors[alert.type])}>
      {icons[alert.type]}
      <span className="flex-1">{alert.message}</span>
      <button onClick={onDismiss} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  )
}

export function AppShell() {
  useTheme()
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'Expense HUD'

  const transactions = useAllTransactions()
  const categoryMap = useCategoryMap()
  const properties = useProperties()
  const snapshots = useNetWorthSnapshots()
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())

  const alerts = useMemo(() =>
    detectAlerts({ transactions, properties, netWorthSnapshots: snapshots, categoryMap }),
    [transactions, properties, snapshots, categoryMap])

  const visibleAlerts = alerts.filter(a => !dismissedAlerts.has(a.id))

  function dismiss(id: string) {
    setDismissedAlerts(prev => new Set([...prev, id]))
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} />
        {visibleAlerts.map(alert => (
          <AlertBanner key={alert.id} alert={alert} onDismiss={() => dismiss(alert.id)} />
        ))}
        <main className="flex-1 px-4 py-4 pb-24 lg:pb-6 lg:px-6 max-w-5xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
