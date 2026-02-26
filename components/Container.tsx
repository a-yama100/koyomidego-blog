interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'full'
  className?: string
}

export function Container({ children, size = 'lg', className = '' }: ContainerProps) {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    full: 'max-w-full'
  }
  return (
    <div className={'mx-auto px-4 sm:px-6 lg:px-8 ' + sizes[size] + ' ' + className}>
      {children}
    </div>
  )
}
