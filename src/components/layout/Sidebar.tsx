import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, List, Upload, TrendingUp, Settings, Wallet,
  Sun, Moon, Monitor, PieChart, Home, BarChart2, Flame, CreditCard, Layers, Eye
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTheme } from '@/hooks/useTheme'

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
  {
    label: 'Explore',
    items: [
      { to: '/visualizations', icon: Eye, label: 'Visualizations', exact: false },
    ],
  },
  {
    label: null,
    items: [
      { to: '/settings', icon: Settings, label: 'Settings', exact: false },
    ],
  },
]

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'Auto' },
]

export function Sidebar() {
  const { theme, setTheme } = useTheme()

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

      {/* Theme toggle */}
      <div className="px-3 py-4 border-t border-gray-100 dark:border-slate-700">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium mb-2 px-1">Theme</p>
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              className={clsx(
                'flex-1 flex items-center justify-center py-1.5 rounded-lg transition-colors',
                theme === value
                  ? 'bg-white dark:bg-slate-600 text-brand shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
