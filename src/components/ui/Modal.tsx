import { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto',
        { 'sm:max-w-sm': size === 'sm', 'sm:max-w-md': size === 'md', 'sm:max-w-2xl': size === 'lg' }
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-slate-700">
          {title && <h2 className="font-semibold text-gray-900 dark:text-white">{title}</h2>}
          <button onClick={onClose} className="ml-auto p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">
            <X size={18} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
