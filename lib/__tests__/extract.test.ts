import { describe, it, expect } from 'vitest'
import { toEvidence, ID_PREFIX } from '@/lib/collectors/extract'

describe('toEvidence', () => {
  it('assigns sequential prefixed ids', () => {
    const out = toEvidence('web', [{ quote: 'a' }, { quote: 'b' }], 'https://x.com', '2026-08-16T00:00:00Z')
    expect(out.map((e) => e.id)).toEqual(['web-1', 'web-2'])
  })

  it('uses the reviews prefix', () => {
    const out = toEvidence('reviews', [{ quote: 'a' }], 'https://g2.com', '2026-08-16T00:00:00Z')
    expect(out[0].id).toBe('rev-1')
    expect(ID_PREFIX.reviews).toBe('rev')
  })

  it('drops items with no usable quote', () => {
    const out = toEvidence('web', [{ quote: '' }, { quote: '   ' }, { quote: 'real' }], 'https://x.com', '2026-08-16T00:00:00Z')
    expect(out).toHaveLength(1)
    expect(out[0].quote).toBe('real')
  })

  it('truncates long quotes', () => {
    const out = toEvidence('web', [{ quote: 'x'.repeat(400) }], 'https://x.com', '2026-08-16T00:00:00Z')
    expect(out[0].quote).toHaveLength(300)
  })

  it('carries url and timestamp onto every item', () => {
    const out = toEvidence('press', [{ quote: 'a' }], 'https://news.com/1', '2026-08-16T00:00:00Z')
    expect(out[0].url).toBe('https://news.com/1')
    expect(out[0].fetched_at).toBe('2026-08-16T00:00:00Z')
  })
})
