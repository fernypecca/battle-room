'use client'

import { useState } from 'react'
import { AgentCard, type AgentStatus } from './AgentCard'
import { PipelineForm, type PipelineInputs } from './PipelineForm'
import { AGENTS } from './agents'

interface AgentSlot {
  status: AgentStatus
  result: string | null
  errorMessage?: string
}

interface AgentRunResult extends Partial<AgentSlot> {
  rateLimited?: boolean
}

const IDLE_SLOT: AgentSlot = { status: 'idle', result: null }

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

  // Shared tail used both by the initial run and by retrying Agent 1 — runs
  // battlecard, then media (independent of battlecard), then outbound (only
  // if battlecard succeeded). Keeping this in one place means a successful
  // retry of an earlier agent can resume the rest of the pipeline instead of
  // leaving downstream idle slots stuck forever.
  async function continueAfterAds(pipelineInputs: PipelineInputs, adsResult: AgentRunResult) {
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

    await continueAfterAds(pipelineInputs, adsResult)
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
      if (result.status === 'error') return
      // Ads only ever fails-then-retries before battlecard has had a chance
      // to run, so slot 1 is always idle here — but check explicitly rather
      // than assume, in case that invariant ever changes.
      if (slots[1].status === 'idle') {
        await continueAfterAds(inputs, result)
      }
      return
    }

    if (index === 1) {
      const adInsights = slots[0].status === 'done' ? slots[0].result : null
      updateSlot(1, { status: 'running', errorMessage: undefined })
      const battlecardResult = await runBattlecardAgent(inputs.yourBrand, inputs.competitorBrand, adInsights)
      updateSlot(1, battlecardResult)

      if (slots[2].status === 'idle') {
        updateSlot(2, { status: 'running' })
        updateSlot(2, await runMediaAgent(inputs.competitorBrand))
      }

      if (slots[3].status === 'idle' && battlecardResult.status === 'done' && battlecardResult.result) {
        updateSlot(3, { status: 'running' })
        updateSlot(3, await runOutboundAgent(battlecardResult.result, inputs.persona))
      }
      return
    }

    if (index === 2) {
      updateSlot(2, { status: 'running', errorMessage: undefined })
      updateSlot(2, await runMediaAgent(inputs.competitorBrand))
      return
    }

    const battlecard = slots[1].status === 'done' ? slots[1].result : null
    if (!battlecard) {
      updateSlot(3, { status: 'error', errorMessage: 'Battlecard is not ready yet — retry it first.' })
      return
    }
    updateSlot(3, { status: 'running', errorMessage: undefined })
    updateSlot(3, await runOutboundAgent(battlecard, inputs.persona))
  }

  return (
    <div className="flex flex-col gap-6">
      <PipelineForm onSubmit={runPipeline} disabled={isRunning} />
      {rateLimitMessage && (
        <p className="animate-rise rounded-[14px] border border-[var(--warn)]/25 bg-[var(--warn-tint)] px-4 py-3 text-[14px] text-[var(--warn)]">
          {rateLimitMessage}
        </p>
      )}
      {inputs && (
        <div className="flex flex-col gap-4">
          {slots.map((slot, i) => (
            <div key={AGENTS[i].title} className="animate-rise relative" style={{ animationDelay: `${i * 0.06}s` }}>
              {/* Connector to the previous card, scoped to this row's own gap
                  so it never depends on a neighboring card's variable height
                  (cards grow a lot once expanded with a result). */}
              {i > 0 && (
                <div
                  className={`absolute -top-4 left-10 h-4 w-px transition-colors duration-500 sm:left-11 ${
                    slots[i - 1].status !== 'idle' ? 'bg-[var(--accent)]/50' : 'bg-[var(--border-soft)]'
                  }`}
                />
              )}
              <AgentCard
                index={i + 1}
                title={AGENTS[i].title}
                description={AGENTS[i].description}
                icon={AGENTS[i].icon}
                status={slot.status}
                result={slot.result}
                errorMessage={slot.errorMessage}
                onRetry={slot.status === 'error' ? () => retryAgent(i) : undefined}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
