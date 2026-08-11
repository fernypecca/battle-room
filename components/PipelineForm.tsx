'use client'

import { useState, type FormEvent } from 'react'

export interface PipelineInputs {
  yourBrand: string
  competitorBrand: string
  persona: string
}

interface PipelineFormProps {
  onSubmit: (inputs: PipelineInputs) => void
  disabled: boolean
}

export function PipelineForm({ onSubmit, disabled }: PipelineFormProps) {
  const [yourBrand, setYourBrand] = useState('')
  const [competitorBrand, setCompetitorBrand] = useState('')
  const [persona, setPersona] = useState('')

  const canSubmit =
    yourBrand.trim().length > 0 && competitorBrand.trim().length > 0 && persona.trim().length > 0 && !disabled

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ yourBrand: yourBrand.trim(), competitorBrand: competitorBrand.trim(), persona: persona.trim() })
  }

  const inputClass =
    'w-full rounded-[14px] border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-[15px] text-[var(--foreground)] outline-none transition-all duration-200 placeholder:text-[var(--muted-2)] focus:border-[var(--accent)]/50 focus:shadow-[0_0_0_4px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--paper)] p-6 shadow-[var(--shadow-md)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Your brand
          </span>
          <input
            value={yourBrand}
            onChange={(e) => setYourBrand(e.target.value)}
            placeholder="e.g. Notion"
            disabled={disabled}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Competitor brand
          </span>
          <input
            value={competitorBrand}
            onChange={(e) => setCompetitorBrand(e.target.value)}
            placeholder="e.g. Coda"
            disabled={disabled}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--muted)]">
            Target persona
          </span>
          <input
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="e.g. Head of Ops at a mid-market SaaS company"
            disabled={disabled}
            className={inputClass}
          />
        </label>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="group relative shrink-0 overflow-hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-6 py-3 text-[14px] font-semibold text-white shadow-[var(--shadow-accent)] transition-all duration-200 hover:enabled:-translate-y-px hover:enabled:shadow-[0_6px_20px_-4px_var(--accent-glow)] active:enabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
        >
          <span className="flex items-center gap-2">
            {disabled && (
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 animate-dot-breathe rounded-full bg-white" />
                <span className="h-1.5 w-1.5 animate-dot-breathe rounded-full bg-white" style={{ animationDelay: '0.2s' }} />
                <span className="h-1.5 w-1.5 animate-dot-breathe rounded-full bg-white" style={{ animationDelay: '0.4s' }} />
              </span>
            )}
            {disabled ? 'Running' : 'Run the pipeline'}
          </span>
        </button>
        <span className="text-[13px] text-[var(--muted-2)]">Takes about a minute, start to finish.</span>
      </div>
    </form>
  )
}
