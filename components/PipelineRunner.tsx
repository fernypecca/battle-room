'use client'

import { useState } from 'react'
import { AgentCard, type AgentStatus } from './AgentCard'
import { PipelineForm, type PipelineInputs } from './PipelineForm'

interface AgentSlot {
  status: AgentStatus
  result: string | null
  errorMessage?: string
}

interface AgentRunResult extends Partial<AgentSlot> {
  rateLimited?: boolean
}

const IDLE_SLOT: AgentSlot = { status: 'idle', result: null }

const AGENT_META = [
  { title: 'Ad Intelligence', description: "Scrapes the competitor's live ads and extracts their angles." },
  { title: 'Battlecard Writer', description: 'Drafts your positioning against this competitor.' },
  { title: 'Media Coverage', description: "Summarizes the competitor's recent press." },
  { title: 'Outbound Sequence', description: 'Writes a 3-email sequence for your target persona.' },
] as const

async function callAgent<T>(
  url: string,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: data?.error ?? 'Request failed.', status: res.status }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, error: 'Network error.', status: 0 }
  }
}

async function runAdsAgent(competitorBrand: string): Promise<AgentRunResult> {
  const res = await callAgent<{ found: boolean; insights: string | null }>('/api/agents/ads', { competitorBrand })
  if (!res.ok) {
    if (res.status === 429) return { status: 'idle', rateLimited: true, errorMessage: res.error }
    return { status: 'error', errorMessage: res.error }
  }
  return res.data.found ? { status: 'done', result: res.data.insights } : { status: 'empty', result: null }
}

async function runBattlecardAgent(
  yourBrand: string,
  competitorBrand: string,
  adInsights: string | null
): Promise<AgentRunResult> {
  const res = await callAgent<{ battlecard: string }>('/api/agents/battlecard', {
    yourBrand,
    competitorBrand,
    adInsights,
  })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return { status: 'done', result: res.data.battlecard }
}

async function runMediaAgent(competitorBrand: string): Promise<AgentRunResult> {
  const res = await callAgent<{ found: boolean; summary: string | null }>('/api/agents/media', { competitorBrand })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return res.data.found ? { status: 'done', result: res.data.summary } : { status: 'empty', result: null }
}

async function runOutboundAgent(battlecard: string, persona: string): Promise<AgentRunResult> {
  const res = await callAgent<{ sequence: string }>('/api/agents/outbound', { battlecard, persona })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return { status: 'done', result: res.data.sequence }
}

export function PipelineRunner() {
  const [inputs, setInputs] = useState<PipelineInputs | null>(null)
  const [slots, setSlots] = useState<[AgentSlot, AgentSlot, AgentSlot, AgentSlot]>([
    IDLE_SLOT,
    IDLE_SLOT,
    IDLE_SLOT,
    IDLE_SLOT,
  ])
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)

  const isRunning = slots.some((s) => s.status === 'running')

  function updateSlot(i: number, patch: AgentRunResult) {
    setSlots((prev) => {
      const next = [...prev] as typeof prev
      next[i] = { ...next[i], ...patch } as AgentSlot
      return next
    })
  }

  async function runPipeline(pipelineInputs: PipelineInputs) {
    setInputs(pipelineInputs)
    setRateLimitMessage(null)
    setSlots([{ ...IDLE_SLOT }, { ...IDLE_SLOT }, { ...IDLE_SLOT }, { ...IDLE_SLOT }])

    updateSlot(0, { status: 'running' })
    const adsResult = await runAdsAgent(pipelineInputs.competitorBrand)
    if (adsResult.rateLimited) {
      setRateLimitMessage(adsResult.errorMessage ?? 'Rate limit reached.')
      updateSlot(0, { status: 'idle' })
      return
    }
    updateSlot(0, adsResult)
    if (adsResult.status === 'error') return

    const adInsights = adsResult.status === 'done' ? (adsResult.result ?? null) : null

    updateSlot(1, { status: 'running' })
    const battlecardResult = await runBattlecardAgent(pipelineInputs.yourBrand, pipelineInputs.competitorBrand, adInsights)
    updateSlot(1, battlecardResult)

    updateSlot(2, { status: 'running' })
    const mediaResult = await runMediaAgent(pipelineInputs.competitorBrand)
    updateSlot(2, mediaResult)

    if (battlecardResult.status !== 'done' || !battlecardResult.result) return

    updateSlot(3, { status: 'running' })
    const outboundResult = await runOutboundAgent(battlecardResult.result, pipelineInputs.persona)
    updateSlot(3, outboundResult)
  }

  async function retryAgent(index: number) {
    if (!inputs) return

    if (index === 0) {
      updateSlot(0, { status: 'running', errorMessage: undefined })
      const result = await runAdsAgent(inputs.competitorBrand)
      if (result.rateLimited) {
        setRateLimitMessage(result.errorMessage ?? 'Rate limit reached.')
        updateSlot(0, { status: 'idle' })
        return
      }
      updateSlot(0, result)
      return
    }

    if (index === 1) {
      const adInsights = slots[0].status === 'done' ? slots[0].result : null
      updateSlot(1, { status: 'running', errorMessage: undefined })
      updateSlot(1, await runBattlecardAgent(inputs.yourBrand, inputs.competitorBrand, adInsights))
      return
    }

    if (index === 2) {
      updateSlot(2, { status: 'running', errorMessage: undefined })
      updateSlot(2, await runMediaAgent(inputs.competitorBrand))
      return
    }

    const battlecard = slots[1].status === 'done' ? slots[1].result : null
    if (!battlecard) return
    updateSlot(3, { status: 'running', errorMessage: undefined })
    updateSlot(3, await runOutboundAgent(battlecard, inputs.persona))
  }

  return (
    <div className="flex flex-col gap-6">
      <PipelineForm onSubmit={runPipeline} disabled={isRunning} />
      {rateLimitMessage && (
        <p className="rounded-[14px] border border-[var(--warn)]/30 bg-[var(--warn-tint)] px-4 py-3 text-[14px] text-[var(--warn)]">
          {rateLimitMessage}
        </p>
      )}
      {inputs && (
        <div className="grid gap-4">
          {slots.map((slot, i) => (
            <AgentCard
              key={AGENT_META[i].title}
              index={i + 1}
              title={AGENT_META[i].title}
              description={AGENT_META[i].description}
              status={slot.status}
              result={slot.result}
              errorMessage={slot.errorMessage}
              onRetry={slot.status === 'error' ? () => retryAgent(i) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
