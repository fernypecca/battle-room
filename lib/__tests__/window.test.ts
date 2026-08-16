import { describe, it, expect } from 'vitest'
import { windowAround } from '@/lib/window'

describe('windowAround', () => {
  it('centres the window on the first match', () => {
    const text = 'A'.repeat(1000) + 'NEEDLE' + 'B'.repeat(1000)
    const out = windowAround(text, [/NEEDLE/], 200)
    expect(out).toContain('NEEDLE')
    expect(out.length).toBeLessThanOrEqual(200)
  })

  it('falls back to the leading slice when nothing matches', () => {
    const text = 'A'.repeat(500) + 'B'.repeat(500)
    const out = windowAround(text, [/NEEDLE/], 100)
    expect(out).toBe('A'.repeat(100))
  })

  it('uses the first pattern that matches, in order', () => {
    const text = 'x'.repeat(100) + 'SECOND' + 'y'.repeat(100) + 'FIRST'
    const out = windowAround(text, [/FIRST/, /SECOND/], 50)
    expect(out).toContain('FIRST')
  })

  it('returns the whole text when it is shorter than the window', () => {
    expect(windowAround('short', [/nope/], 100)).toBe('short')
  })

  it('does not run past the start of the text', () => {
    const text = 'NEEDLE' + 'B'.repeat(1000)
    const out = windowAround(text, [/NEEDLE/], 100)
    expect(out.startsWith('NEEDLE')).toBe(true)
    expect(out.length).toBe(100)
  })
})
