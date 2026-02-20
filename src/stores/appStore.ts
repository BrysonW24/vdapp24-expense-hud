import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppStore {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarOpen: false,
      setTheme: (theme) => set({ theme }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'app-store' }
  )
)
