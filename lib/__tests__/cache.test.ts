import { describe, it, expect } from 'vitest'
import { MemoryCache } from '@/lib/cache'

describe('MemoryCache.incr', () => {
  it('starts at 1', async () => {
    expect(await new MemoryCache().incr('k')).toBe(1)
  })

  it('increments on repeat calls', async () => {
    const c = new MemoryCache()
    await c.incr('k')
    await c.incr('k')
    expect(await c.incr('k')).toBe(3)
  })

  it('keeps separate keys separate', async () => {
    const c = new MemoryCache()
    await c.incr('a')
    expect(await c.incr('b')).toBe(1)
  })
})
