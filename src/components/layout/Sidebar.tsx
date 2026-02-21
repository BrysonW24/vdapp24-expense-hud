import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, List, Upload, TrendingUp, Wallet,
  PieChart, Home, BarChart2, Flame, CreditCard, Layers, Eye,
  Cloud, CloudOff, Loader2, Sparkles
} from 'lucide-react'
import { clsx } from 'clsx'
import { useSyncStatus } from '@/hooks/useSyncContext'

const NAV_SECTIONS = [
  {
    label: null,
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    ],
  },
  {
    label: 'Wealth',
    items: [
      { to: '/networth', icon: PieChart, label: 'Net Worth', exact: false },
      { to: '/properties', icon: Home, label: 'Properties', exact: false },
      { to: '/forecast', icon: BarChart2, label: 'Forecast', exact: false },
      { to: '/fire', icon: Flame, label: 'FIRE', exact: false },
      { to: '/debt', icon: CreditCard, label: 'Debt', exact: false },
      { to: '/simulate', icon: Layers, label: 'Simulate', exact: false },
    ],
  },
  {
    label: 'Spending',
    items: [
      { to: '/transactions', icon: List, label: 'Transactions', exact: false },
      { to: '/import', icon: Upload, label: 'Import', exact: false },
      { to: '/insights', icon: TrendingUp, label: 'Insights', exact: false },
    ],
  },
]

export function Sidebar() {
  const { syncState, lastSynced } = useSyncStatus()

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 h-screen sticky top-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100 dark:border-slate-700">
        <div className="w-8 h-8 rounded-xl bg-brand flex items-center justify-center">
          <Wallet size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-gray-900 dark:text-white">Expense HUD</p>
          <p className="text-[10px] text-gray-400">Personal Finance OS</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {NAV_SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-4' : ''}>
            {section.label && (
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold px-3 mb-1">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(({ to, icon: Icon, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  className={({ isActive }) =>
                    clsx('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand/10 text-brand'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={17} strokeWidth={isActive ? 2.5 : 1.5} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Visualizations standout */}
      <div className="px-3 pb-3">
        <NavLink
          to="/visualizations"
          className={({ isActive }) =>
            clsx(
              'group relative block rounded-xl overflow-hidden transition-all',
              isActive
                ? 'bg-gradient-to-br from-brand to-orange-600 shadow-lg shadow-brand/25'
                : 'bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-800 dark:to-slate-900 hover:from-brand/90 hover:to-orange-600/90 hover:shadow-lg hover:shadow-brand/20'
            )
          }
        >
          {({ isActive }) => (
            <div className="relative px-4 py-3">
              {/* Decorative dots */}
              <div className="absolute inset-0 opacity-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-white animate-pulse"
                    style={{
                      right: `${10 + i * 14}%`,
                      top: `${20 + (i % 3) * 25}%`,
                      animationDelay: `${i * 0.3}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative flex items-center gap-3">
                <div className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isActive ? 'bg-white/20' : 'bg-brand/20'
                )}>
                  <Sparkles size={15} className={isActive ? 'text-white' : 'text-brand'} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      'text-sm font-semibold',
                      isActive ? 'text-white' : 'text-white'
                    )}>
                      Visualizations
                    </span>
                    <span className={clsx(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-brand/20 text-brand'
                    )}>
                      22
                    </span>
                  </div>
                  <p className={clsx(
                    'text-[10px] mt-0.5',
                    isActive ? 'text-white/70' : 'text-gray-400'
                  )}>
                    Interactive gallery
                  </p>
                </div>
              </div>
            </div>
          )}
        </NavLink>
      </div>

      {/* Sync status */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-700 flex items-center gap-2">
        {syncState === 'syncing' ? (
          <Loader2 size={12} className="text-brand animate-spin" />
        ) : syncState === 'offline' ? (
          <CloudOff size={12} className="text-gray-400" />
        ) : (
          <Cloud size={12} className="text-green-500" />
        )}
        <span className="text-[10px] text-gray-400">
          {syncState === 'syncing' ? 'Syncing...' :
           syncState === 'offline' ? 'Offline' :
           syncState === 'error' ? 'Sync error' :
           lastSynced ? `Synced ${lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` :
           'Cloud sync'}
        </span>
      </div>
    </aside>
  )
}
