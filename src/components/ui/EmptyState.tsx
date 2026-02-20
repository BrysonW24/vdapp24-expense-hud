interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-4xl mb-4 text-gray-300 dark:text-gray-600">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
