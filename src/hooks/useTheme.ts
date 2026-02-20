import { useEffect } from 'react'
import { useAppStore } from '@/stores/appStore'

function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else if (theme === 'light') {
    root.classList.remove('dark')
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

export function useTheme() {
  const { theme, setTheme } = useAppStore()

  useEffect(() => {
    applyTheme(theme)

    // For system theme, listen for OS changes
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return { theme, setTheme }
}

// Apply theme immediately on load (before React hydrates) to prevent flash
applyTheme((() => {
  try {
    const stored = JSON.parse(localStorage.getItem('app-store') ?? '{}')
    return stored?.state?.theme ?? 'system'
  } catch {
    return 'system'
  }
})())
