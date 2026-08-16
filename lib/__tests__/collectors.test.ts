import { describe, it, expect } from 'vitest'
import { runCollectors, mergeEvidence } from '@/lib/collectors'
import type { Collector } from '@/lib/collectors/types'
import type { Evidence } from '@/lib/evidence'

function stub(source: Collector['source'], behaviour: 'ok' | 'empty' | 'throw'): Collector {
  return {
    source,
    async collect() {
      if (behaviour === 'throw') throw new Error('boom')
      if (behaviour === 'empty') return { source, evidence: null }
      return {
        source,
        evidence: [{ id: `${source}-1`, source, url: 'https://x', quote: 'q', fetched_at: 'now' }],
      }
    },
  }
}

describe('runCollectors', () => {
  it('returns one result per collector', async () => {
    const results = await runCollectors('acme', 'https://acme.com', [
      stub('web', 'ok'),
      stub('reviews', 'empty'),
    ])
    expect(results).toHaveLength(2)
  })

  it('converts a thrown collector into an error result', async () => {
    const results = await runCollectors('acme', 'https://acme.com', [stub('ads', 'throw')])
    expect(results[0].evidence).toBeNull()
    expect(results[0].error).toBeTruthy()
  })

  it('does not let one failure stop the others', async () => {
    const results = await runCollectors('acme', 'https://acme.com', [
      stub('ads', 'throw'),
      stub('web', 'ok'),
    ])
    expect(results[1].evidence).toHaveLength(1)
  })
})

describe('mergeEvidence', () => {
  it('flattens evidence across results and skips nulls', () => {
    const a: Evidence = { id: 'web-1', source: 'web', url: 'u', quote: 'q', fetched_at: 't' }
    const merged = mergeEvidence([
      { source: 'web', evidence: [a] },
      { source: 'reviews', evidence: null },
    ])
    expect(merged).toEqual([a])
  })
})
