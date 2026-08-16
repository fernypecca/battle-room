'use client'

import { useState } from 'react'
import type { Evidence } from '@/lib/evidence'

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * The whole product promise in one component: no claim renders without one
 * of these, and opening it shows the exact text the claim came from.
 */
export function Citation({ evidence }: { evidence: Evidence }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Source: ${domainOf(evidence.url)}`}
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
        className="mx-[1px] rounded-[5px] bg-[var(--accent-tint)] px-[5px] py-[1px] align-super text-[10px] font-semibold text-[var(--accent-text)] transition-colors duration-200 hover:bg-[var(--accent)] hover:text-white"
      >
        {evidence.id}
      </button>

      {open && (
        <span
          role="tooltip"
          className="animate-rise absolute bottom-[calc(100%+8px)] left-1/2 z-20 w-[min(320px,calc(100vw-32px))] -translate-x-1/2 rounded-[14px] border border-[var(--border-soft)] bg-[var(--paper)] p-3.5 text-left shadow-[var(--shadow-lg)]"
        >
          <span className="block text-[13.5px] leading-relaxed text-[var(--foreground)]">
            &ldquo;{evidence.quote}&rdquo;
          </span>
          <a
            href={evidence.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2.5 block truncate text-[12px] font-medium text-[var(--accent-text)] hover:underline"
          >
            {domainOf(evidence.url)} ↗
          </a>
          <span className="mt-0.5 block text-[11px] text-[var(--muted-2)]">
            Fetched {formatDate(evidence.fetched_at)}
          </span>
        </span>
      )}
    </span>
  )
}
