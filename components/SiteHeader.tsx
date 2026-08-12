'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// The page opens on a dark hero band, so the sticky header starts
// transparent/light-on-dark to blend into it, then crosses over to the
// normal light/blurred nav once the user scrolls past the hero.
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 48)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? 'border-[var(--border-soft)] bg-[var(--background)]/80 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-4xl items-center justify-between px-6">
        <Link
          href="/"
          className={`flex items-center gap-2 text-[14px] font-semibold tracking-tight transition-colors duration-300 ${
            scrolled ? 'text-[var(--foreground)]' : 'text-[var(--hero-fg)]'
          }`}
        >
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] bg-[var(--accent)] text-[10px] font-bold text-white">
            G
          </span>
          <span className="sm:hidden">GAO</span>
          <span className="hidden sm:inline">Growth Agent Orchestrator</span>
        </Link>
        <a
          href="https://github.com/fernypecca/v2-claude"
          target="_blank"
          rel="noopener noreferrer"
          className={`text-[13px] font-medium transition-colors duration-300 ${
            scrolled ? 'text-[var(--muted)] hover:text-[var(--foreground)]' : 'text-[var(--hero-muted)] hover:text-[var(--hero-fg)]'
          }`}
        >
          View source ↗
        </a>
      </div>
    </header>
  )
}
