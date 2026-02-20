import { create } from 'zustand'
import type { ParsedRow, BankFormat, CategoryMatch } from '@/types'

interface ImportStore {
  file: File | null
  csvText: string
  detectedFormat: BankFormat | null
  parsedRows: ParsedRow[]
  categorised: CategoryMatch[]
  step: 'upload' | 'preview' | 'done'
  setFile: (file: File, text: string) => void
  setDetectedFormat: (format: BankFormat) => void
  setParsedRows: (rows: ParsedRow[]) => void
  setCategorised: (matches: CategoryMatch[]) => void
  setStep: (step: 'upload' | 'preview' | 'done') => void
  reset: () => void
  updateCategoryMatch: (index: number, categoryId: number) => void
}

export const useImportStore = create<ImportStore>((set) => ({
  file: null,
  csvText: '',
  detectedFormat: null,
  parsedRows: [],
  categorised: [],
  step: 'upload',
  setFile: (file, text) => set({ file, csvText: text, step: 'upload' }),
  setDetectedFormat: (detectedFormat) => set({ detectedFormat }),
  setParsedRows: (parsedRows) => set({ parsedRows }),
  setCategorised: (categorised) => set({ categorised }),
  setStep: (step) => set({ step }),
  reset: () => set({ file: null, csvText: '', detectedFormat: null, parsedRows: [], categorised: [], step: 'upload' }),
  updateCategoryMatch: (index, categoryId) =>
    set((state) => {
      const updated = [...state.categorised]
      updated[index] = { ...updated[index], categoryId }
      return { categorised: updated }
    }),
}))
