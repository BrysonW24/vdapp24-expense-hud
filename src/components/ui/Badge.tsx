import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
}

export function Badge({ children, color, className, style, onClick }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      style={style ?? (color ? { backgroundColor: color + '22', color } : undefined)}
    >
      {children}
    </span>
  )
}
