'use client'

import { useState } from 'react'

interface CopyButtonProps {
  text: string
  buttonText?: string
  className?: string
}

export function CopyButton({ text, buttonText = 'Copy', className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className={'px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer '
        + (copied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
        + ' ' + className}
    >
      {copied ? 'Copied!' : buttonText}
    </button>
  )
}
