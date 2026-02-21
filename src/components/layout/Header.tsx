import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Monitor, Settings, LogOut, User } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { clsx } from 'clsx'

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun },
  { value: 'dark' as const, icon: Moon },
  { value: 'system' as const, icon: Monitor },
]

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : '?'

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 px-4 lg:px-6 py-3 flex items-center justify-between">
      {/* Page title — always visible on mobile, invisible spacer on desktop */}
      <h1 className="font-bold text-lg text-gray-900 dark:text-white lg:opacity-0 lg:pointer-events-none">{title}</h1>

      {/* Right side controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
          {THEME_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={clsx(
                'p-2 sm:p-1.5 rounded-lg transition-colors',
                theme === value
                  ? 'bg-white dark:bg-slate-600 text-brand shadow-sm'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Settings shortcut */}
        <button
          onClick={() => navigate('/settings')}
          className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        {/* Profile avatar / dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold hover:bg-brand/20 transition-colors"
            title={user?.email ?? 'Account'}
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-56 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-lg py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user?.email ?? 'Offline'}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {user ? 'Cloud synced' : 'Local only'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <button
                onClick={() => { navigate('/settings'); setMenuOpen(false) }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <User size={14} />
                Account & Settings
              </button>

              {user && (
                <button
                  onClick={() => { signOut(); setMenuOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
