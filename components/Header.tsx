'use client'
import Link from 'next/link'
import { useState } from 'react'
import { Container } from './Container'
import { CurrentMonthLink } from './CurrentMonthLink'

function SiteLogo() {
  return (
    <svg viewBox="0 0 32 32" className="w-8 h-8" aria-hidden="true">
      <rect x="2" y="6" width="28" height="24" rx="3" fill="#4f46e5"/>
      <rect x="2" y="6" width="28" height="8" rx="3" fill="#818cf8"/>
      <rect x="7" y="2" width="3" height="7" rx="1.5" fill="#a5b4fc"/>
      <rect x="22" y="2" width="3" height="7" rx="1.5" fill="#a5b4fc"/>
      <text x="16" y="25" textAnchor="middle" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="white">暦</text>
    </svg>
  )
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navLinkClass = "px-3 py-1 bg-indigo-700 text-white text-sm font-medium rounded hover:bg-indigo-800 transition-colors"
  const mobileLinkClass = "block px-3 py-1.5 bg-indigo-700 text-white text-sm font-medium rounded hover:bg-indigo-800 transition-colors"
  return (
    <header className="bg-indigo-950 border-b border-indigo-800 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo />
            <span className="text-lg font-bold text-white">{'暦でゴー！'}</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-3">
            <CurrentMonthLink className={navLinkClass}>{'カレンダー'}</CurrentMonthLink>
            <Link href="/best-days" className={navLinkClass}>{'吉日一覧'}</Link>
            <Link href="/about" className={navLinkClass}>{'暦について'}</Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <button
              className="cursor-pointer p-2 text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <nav className="md:hidden py-3 border-t border-indigo-800">
            <div className="flex flex-col space-y-2">
              <CurrentMonthLink className={mobileLinkClass} onClick={() => setIsMenuOpen(false)}>{'カレンダー'}</CurrentMonthLink>
              <Link href="/best-days" className={mobileLinkClass} onClick={() => setIsMenuOpen(false)}>{'吉日一覧'}</Link>
              <Link href="/about" className={mobileLinkClass} onClick={() => setIsMenuOpen(false)}>{'暦について'}</Link>
            </div>
          </nav>
        )}
      </Container>
    </header>
  )
}
