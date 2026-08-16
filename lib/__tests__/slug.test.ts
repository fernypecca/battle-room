import { describe, it, expect } from 'vitest'
import { toSlug } from '@/lib/slug'

describe('toSlug', () => {
  it('handles a bare domain', () => {
    expect(toSlug('notion.so')).toBe('notion')
  })

  it('handles a full URL with a path', () => {
    expect(toSlug('https://www.notion.so/pricing')).toBe('notion')
  })

  it('ignores a common subdomain', () => {
    expect(toSlug('https://app.hubspot.com')).toBe('hubspot')
  })

  it('keeps an uncommon subdomain as the identity', () => {
    expect(toSlug('https://shop.example.com')).toBe('shop')
  })

  it('lowercases', () => {
    expect(toSlug('HTTPS://Linear.APP')).toBe('linear')
  })

  it('returns null for junk', () => {
    expect(toSlug('not a url')).toBeNull()
    expect(toSlug('')).toBeNull()
  })
})
