'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'white' | 'white-outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  fullWidth?: boolean
}

const variantStyles = {
  primary: 'bg-indigo-700 text-white hover:bg-indigo-800 border-transparent',
  secondary: 'bg-slate-600 text-white hover:bg-slate-700 border-transparent',
  outline: 'bg-transparent text-gray-900 hover:bg-gray-100 border-gray-300',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 border-transparent',
  white: 'bg-white text-gray-900 hover:bg-gray-100 border-transparent',
  'white-outline': 'bg-transparent text-white hover:bg-white/10 border-white',
}

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={
        'inline-flex items-center justify-center font-semibold rounded-md border transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed '
        + variantStyles[variant] + ' '
        + sizeStyles[size] + ' '
        + (fullWidth ? 'w-full ' : '')
        + className
      }
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
