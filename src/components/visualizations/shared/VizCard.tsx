import { clsx } from 'clsx'

interface VizCardProps {
  title: string
  description: string
  children: React.ReactNode
  className?: string
  fullWidth?: boolean
}

export function VizCard({ title, description, children, className, fullWidth }: VizCardProps) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4',
        fullWidth && 'col-span-full',
        className,
      )}
    >
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      {children}
    </div>
  )
}
