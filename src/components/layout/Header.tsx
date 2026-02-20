import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { clsx } from 'clsx'

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun },
  { value: 'dark' as const, icon: Moon },
  { value: 'system' as const, icon: Monitor },
]

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-700 px-4 py-3 flex items-center justify-between lg:hidden">
      <h1 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h1>
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-0.5">
        {THEME_OPTIONS.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              theme === value
                ? 'bg-white dark:bg-slate-600 text-brand shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            )}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </header>
  )
}
