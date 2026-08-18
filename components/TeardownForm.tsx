'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

export function TeardownForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!url.trim() || busy) return

    setBusy(true)
    setError(null)

    try {
      const res = await fetch('/api/teardown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong. Try again.')
        setBusy(false)
        return
      }

      router.push(`/teardown/${data.teardown.slug}`)
    } catch {
      setError('Network error. Check your connection and try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={busy}
          placeholder="notion.so"
          aria-label="Competitor URL"
          className="w-full rounded-[14px] border border-[var(--hero-border)] bg-white/[0.06] px-4 py-3.5 text-[16px] text-[var(--hero-fg)] outline-none transition-all duration-200 placeholder:text-[var(--hero-muted)]/60 focus:border-[var(--accent-bright)]/60 focus:bg-white/[0.09] disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={busy || url.trim().length === 0}
          className="shrink-0 rounded-[14px] bg-[var(--accent)] px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[var(--accent-bright)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Reading their sources…' : 'Run the teardown'}
        </button>
      </div>

      {busy && (
        <p className="text-[13.5px] text-[var(--hero-muted)]">
          Reading their site, pricing, reviews, ads and press. Under a minute.
        </p>
      )}

      {error && (
        <p className="animate-rise rounded-[14px] border border-[var(--bad)]/30 bg-[var(--bad)]/10 px-4 py-3 text-[14px] text-[#ff9b96]">
          {error}
        </p>
      )}
    </form>
  )
}
