import { describe, it, expect } from 'vitest'
import { extractJson } from '@/lib/claude'

describe('extractJson', () => {
  it('parses a bare array', () => {
    expect(extractJson('[{"a":1}]')).toEqual([{ a: 1 }])
  })

  it('parses a fenced block', () => {
    expect(extractJson('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }])
  })

  it('parses a fenced block with no language tag', () => {
    expect(extractJson('```\n[{"a":1}]\n```')).toEqual([{ a: 1 }])
  })

  it('ignores prose around the JSON', () => {
    expect(extractJson('Here you go:\n[{"a":1}]\nHope that helps.')).toEqual([{ a: 1 }])
  })

  it('throws on unparseable output', () => {
    expect(() => extractJson('no json at all')).toThrow(/could not be parsed/i)
  })
})
