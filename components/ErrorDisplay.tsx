interface ErrorDisplayProps {
  error: string | null
  className?: string
}

export function ErrorDisplay({ error, className = '' }: ErrorDisplayProps) {
  if (!error) return null
  return (
    <div className={'p-4 bg-red-50 border border-red-200 rounded-lg ' + className}>
      <p className="text-red-700 text-sm">{error}</p>
    </div>
  )
}
