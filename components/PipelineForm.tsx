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

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Your brand</span>
        <input
          value={yourBrand}
          onChange={(e) => setYourBrand(e.target.value)}
          placeholder="e.g. Notion"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Competitor brand</span>
        <input
          value={competitorBrand}
          onChange={(e) => setCompetitorBrand(e.target.value)}
          placeholder="e.g. Coda"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Target persona</span>
        <input
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="e.g. Head of Ops at a mid-market SaaS company"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {disabled ? 'Running…' : 'Run the pipeline'}
        </button>
      </div>
    </form>
  )
}
