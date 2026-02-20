import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, CheckCircle, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { parseCSV, FORMAT_LABELS } from '@/lib/parsers'
import { categoriseAll } from '@/lib/categoriser'
import { useCategories } from '@/hooks/useCategories'
import { useImportBatches, addImportBatch } from '@/hooks/useImportBatches'
import { bulkAddTransactions } from '@/hooks/useTransactions'
import { useImportStore } from '@/stores/importStore'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { BankFormat } from '@/types'

const FORMAT_OPTIONS: { value: BankFormat; label: string; hint: string }[] = [
  { value: 'commbank', label: 'CommBank', hint: 'Desktop NetBank only → click account → Export → select CSV format (not PDF)' },
  { value: 'nab', label: 'NAB', hint: 'Internet Banking → Accounts → Export CSV' },
  { value: 'anz', label: 'ANZ', hint: 'ANZ Internet Banking → Export (CSV)' },
  { value: 'westpac', label: 'Westpac', hint: 'Westpac Live → Export → CSV' },
  { value: 'up', label: 'Up Bank', hint: 'Up app → Insights → Export CSV' },
  { value: 'ing', label: 'ING', hint: 'ING internet banking → My Account → Download transactions → CSV' },
  { value: 'generic', label: 'Generic', hint: 'Date, Amount, Description columns' },
]

export function ImportPage() {
  const navigate = useNavigate()
  const categories = useCategories()
  const batches = useImportBatches()
  const {
    file, detectedFormat, parsedRows, categorised, step,
    setFile, setDetectedFormat, setParsedRows, setCategorised, setStep, reset, updateCategoryMatch
  } = useImportStore()

  const [dragging, setDragging] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [parseWarnings, setParseWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [manualFormat, setManualFormat] = useState<BankFormat | null>(null)
  const [bankAccountName, setBankAccountName] = useState('Main Account')

  const handleFile = useCallback((f: File) => {
    setUploadErrors([])
    setParseWarnings([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setFile(f, text)
      const result = parseCSV(text, manualFormat ?? undefined)
      setDetectedFormat(result.format)
      setParsedRows(result.rows)
      if (result.rows.length > 0) {
        if (result.errors.length > 0) setParseWarnings(result.errors)
        const matches = categoriseAll(result.rows, categories)
        setCategorised(matches)
        setStep('preview')
      } else {
        const errs = result.errors.length > 0
          ? result.errors
          : ['No transactions found. Make sure you selected the correct bank format.']
        setUploadErrors(errs)
      }
    }
    reader.onerror = () => setUploadErrors(['Could not read file. Please try again.'])
    reader.readAsText(f)
  }, [categories, manualFormat, setFile, setDetectedFormat, setParsedRows, setCategorised, setStep])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleConfirmImport = async () => {
    if (!categorised.length) return
    setSaving(true)
    try {
      const dates = parsedRows.map(r => r.date).sort((a, b) => a.getTime() - b.getTime())
      const batchId = await addImportBatch({
        filename: file?.name ?? 'unknown.csv',
        bankFormat: detectedFormat ?? 'generic',
        transactionCount: categorised.length,
        dateFrom: dates[0],
        dateTo: dates[dates.length - 1],
        importedAt: new Date(),
      })
      const now = new Date()
      await bulkAddTransactions(
        categorised.map(m => ({
          date: m.row.date,
          description: m.row.description,
          amount: m.row.amount,
          balance: m.row.balance,
          categoryId: m.categoryId,
          bankAccount: bankAccountName,
          importBatchId: batchId,
          createdAt: now,
          updatedAt: now,
        }))
      )
      setStep('done')
    } finally {
      setSaving(false)
    }
  }


  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Import Complete!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{categorised.length} transactions imported successfully.</p>
        <div className="flex gap-3">
          <Button onClick={() => { reset(); }} variant="secondary">Import Another</Button>
          <Button onClick={() => navigate('/')}>View Dashboard</Button>
        </div>
      </div>
    )
  }

  if (step === 'preview' && parsedRows.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{file?.name}</h2>
            <p className="text-sm text-gray-500">{parsedRows.length} transactions · {FORMAT_LABELS[detectedFormat ?? 'generic']}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={reset}>Change File</Button>
        </div>

        {parseWarnings.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
            {parseWarnings.map((e, i) => <p key={i} className="text-sm text-amber-700 dark:text-amber-300">{e}</p>)}
          </div>
        )}

        <Card className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Account label</label>
          <input
            value={bankAccountName}
            onChange={e => setBankAccountName(e.target.value)}
            className="flex-1 bg-transparent border-b border-gray-200 dark:border-slate-600 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand"
          />
        </Card>

        <div className="overflow-auto rounded-2xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                <th className="text-left px-3 py-2 font-medium text-gray-500">Date</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Description</th>
                <th className="text-right px-3 py-2 font-medium text-gray-500">Amount</th>
                <th className="text-left px-3 py-2 font-medium text-gray-500">Category</th>
              </tr>
            </thead>
            <tbody>
              {categorised.map((m, i) => {
                // categoryMap[m.categoryId] unused in this row
                return (
                  <tr key={i} className="border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{formatDate(m.row.date, 'dd MMM')}</td>
                    <td className="px-3 py-2 text-gray-900 dark:text-white max-w-[200px] truncate">{m.row.description}</td>
                    <td className={clsx('px-3 py-2 text-right font-medium tabular-nums whitespace-nowrap', m.row.amount >= 0 ? 'amount-positive' : 'amount-negative')}>
                      {m.row.amount >= 0 ? '+' : '-'}{formatCurrency(m.row.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="relative">
                        <select
                          value={m.categoryId}
                          onChange={e => updateCategoryMatch(i, Number(e.target.value))}
                          className="appearance-none bg-transparent text-xs text-gray-700 dark:text-gray-300 pr-4 focus:outline-none cursor-pointer"
                        >
                          {categories.filter(c => c.type === (m.row.amount >= 0 ? 'income' : 'expense') || c.type === 'transfer').map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-0 top-1 text-gray-400 pointer-events-none" />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={reset} className="flex-1">Cancel</Button>
          <Button onClick={handleConfirmImport} disabled={saving} className="flex-1">
            {saving ? 'Importing...' : `Import ${categorised.length} Transactions`}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Format selector */}
      <Card>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
          Bank format
          <span className="ml-2 font-normal text-gray-400">auto-detected, or select to override</span>
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {FORMAT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setManualFormat(manualFormat === opt.value ? null : opt.value)}
              title={opt.hint}
              className={clsx(
                'px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                manualFormat === opt.value
                  ? 'bg-brand text-white border-brand'
                  : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-brand'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {manualFormat && (
          <p className="text-xs text-gray-400 mt-1">
            {FORMAT_OPTIONS.find(o => o.value === manualFormat)?.hint}
          </p>
        )}
        {!manualFormat && (
          <p className="text-xs text-gray-400 mt-1">
            Note: CommBank only exports CSV from desktop NetBank — the app only gives PDFs. Select your bank above to see exact steps.
          </p>
        )}
      </Card>

      {/* Upload errors */}
      {uploadErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          {uploadErrors.map((e, i) => <p key={i} className="text-sm text-red-700 dark:text-red-300">{e}</p>)}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer',
          dragging ? 'border-brand bg-brand/5' : 'border-gray-200 dark:border-slate-600 hover:border-brand hover:bg-gray-50 dark:hover:bg-slate-800'
        )}
      >
        <label className="cursor-pointer flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center">
            <Upload size={24} className="text-brand" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-gray-900 dark:text-white">Drop your CSV file here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse · CommBank, NAB, ANZ, Westpac supported</p>
          </div>
          <input type="file" accept=".csv" className="hidden" onChange={onFileInput} />
        </label>
      </div>

      {/* Import history */}
      {batches.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">Import History</h3>
          <div className="space-y-2">
            {batches.map(b => (
              <Card key={b.id} className="flex items-center gap-3">
                <FileText size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{b.filename}</p>
                  <p className="text-xs text-gray-400">{b.transactionCount} transactions · {FORMAT_LABELS[b.bankFormat]}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-400">{formatDate(b.importedAt)}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
