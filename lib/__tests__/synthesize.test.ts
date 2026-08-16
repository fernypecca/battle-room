import { describe, it, expect } from 'vitest'
import { buildEvidenceBlock, finalizeSections, SECTION_IDS } from '@/lib/synthesize'
import type { Evidence } from '@/lib/evidence'

const evidence: Evidence[] = [
  { id: 'web-1', source: 'web', url: 'https://acme.com', quote: 'Built for teams', fetched_at: 't' },
]

describe('buildEvidenceBlock', () => {
  it('renders each item with its id and quote', () => {
    const block = buildEvidenceBlock(evidence)
    expect(block).toContain('[web-1]')
    expect(block).toContain('Built for teams')
  })

  it('says so explicitly when there is no evidence', () => {
    expect(buildEvidenceBlock([])).toContain('No evidence')
  })
})

describe('finalizeSections', () => {
  it('keeps valid citations and flags the section as having data', () => {
    const out = finalizeSections({ positioning: 'They target teams [web-1].' }, evidence)
    const section = out.find((s) => s.id === 'positioning')!
    expect(section.body).toBe('They target teams [web-1].')
    expect(section.hasData).toBe(true)
  })

  it('strips unknown citations', () => {
    const out = finalizeSections({ positioning: 'Invented [web-42].' }, evidence)
    expect(out.find((s) => s.id === 'positioning')!.body).toBe('Invented.')
  })

  it('marks a missing section as having no data', () => {
    const out = finalizeSections({}, evidence)
    expect(out.every((s) => s.hasData === false)).toBe(true)
  })

  it('always returns all seven sections in order', () => {
    const out = finalizeSections({}, evidence)
    expect(out.map((s) => s.id)).toEqual([...SECTION_IDS])
  })
})
