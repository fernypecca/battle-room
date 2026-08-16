import { describe, it, expect } from 'vitest'
import { validateCitations, type Evidence } from '@/lib/evidence'

const evidence: Evidence[] = [
  { id: 'web-1', source: 'web', url: 'https://x.com', quote: 'q', fetched_at: '2026-08-16T00:00:00Z' },
  { id: 'rev-2', source: 'reviews', url: 'https://g2.com', quote: 'q', fetched_at: '2026-08-16T00:00:00Z' },
]

describe('validateCitations', () => {
  it('keeps citations that exist in the evidence set', () => {
    const { text, dropped } = validateCitations('They charge per seat [web-1].', evidence)
    expect(text).toBe('They charge per seat [web-1].')
    expect(dropped).toEqual([])
  })

  it('strips citations that do not exist', () => {
    const { text, dropped } = validateCitations('Made up claim [web-99].', evidence)
    expect(text).toBe('Made up claim.')
    expect(dropped).toEqual(['web-99'])
  })

  it('handles several citations in one line, keeping only the real ones', () => {
    const { text, dropped } = validateCitations('A [web-1] and B [rev-2] and C [ads-7].', evidence)
    expect(text).toBe('A [web-1] and B [rev-2] and C.')
    expect(dropped).toEqual(['ads-7'])
  })

  it('leaves text with no citations alone', () => {
    const { text, dropped } = validateCitations('No data found for this source.', evidence)
    expect(text).toBe('No data found for this source.')
    expect(dropped).toEqual([])
  })

  it('reports each dropped id once even when repeated', () => {
    const { dropped } = validateCitations('X [web-9]. Y [web-9].', evidence)
    expect(dropped).toEqual(['web-9'])
  })
})
