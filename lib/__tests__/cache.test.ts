import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryCache, resetMemoryCache } from '@/lib/cache'

describe('MemoryCache.incr', () => {
  // State is shared across instances on purpose — Next gives route handlers
  // and server components separate module graphs, so a per-instance Map made
  // the teardown page 404 on data the API had just written.
  beforeEach(resetMemoryCache)

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
