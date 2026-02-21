import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, List, Upload, TrendingUp, MoreHorizontal,
  PieChart, Home, BarChart2, Flame, CreditCard, Layers, Settings, X, Eye
} from 'lucide-react'
import { clsx } from 'clsx'

const PRIMARY_TABS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/transactions', icon: List, label: 'Transactions', exact: false },
  { to: '/insights', icon: TrendingUp, label: 'Insights', exact: false },
  { to: '/import', icon: Upload, label: 'Import', exact: false },
]

const MORE_ITEMS = [
  { to: '/networth', icon: PieChart, label: 'Net Worth' },
  { to: '/properties', icon: Home, label: 'Properties' },
  { to: '/forecast', icon: BarChart2, label: 'Forecast' },
  { to: '/fire', icon: Flame, label: 'FIRE' },
  { to: '/debt', icon: CreditCard, label: 'Debt' },
  { to: '/simulate', icon: Layers, label: 'Simulate' },
  { to: '/visualizations', icon: Eye, label: 'Visualizations' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const navigate = useNavigate()

  function handleMoreNav(to: string) {
    setMoreOpen(false)
    navigate(to)
  }

  return (
    <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {moreOpen && (
        <div className="fixed bottom-[64px] left-0 right-0 z-50 lg:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 rounded-t-2xl shadow-2xl max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">More</p>
            <button onClick={() => setMoreOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X size={18} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 p-3">
            {MORE_ITEMS.map(({ to, icon: Icon, label }) => (
              <button key={to} onClick={() => handleMoreNav(to)}
                className="flex flex-col items-center gap-1.5 py-4 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <Icon size={22} strokeWidth={1.5} className="text-gray-600 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 bottom-nav-safe z-40 lg:hidden">
        <div className="flex items-center justify-around pt-2">
          {PRIMARY_TABS.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                clsx('flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[56px]',
                  isActive ? 'text-brand' : 'text-gray-400 dark:text-gray-500'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(o => !o)}
            className={clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors min-w-[56px]',
              moreOpen ? 'text-brand' : 'text-gray-400 dark:text-gray-500'
            )}
          >
            <MoreHorizontal size={22} strokeWidth={moreOpen ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  )
}
