import { describe, it, expect } from 'vitest'
import { createThrottle, isRateLimitError } from '@/lib/throttle'

describe('createThrottle', () => {
  it('runs tasks one at a time in order', async () => {
    const order: number[] = []
    const throttle = createThrottle(0)
    await Promise.all([1, 2, 3].map((n) => throttle(async () => { order.push(n) })))
    expect(order).toEqual([1, 2, 3])
  })

  it('spaces calls by at least the minimum interval', async () => {
    const throttle = createThrottle(60)
    const started: number[] = []
    await Promise.all([1, 2].map(() => throttle(async () => { started.push(Date.now()) })))
    expect(started).toHaveLength(2)
    expect(started[1] - started[0]).toBeGreaterThanOrEqual(55)
  })

  it('does not let one rejection stall the queue', async () => {
    const throttle = createThrottle(0)
    const failed = throttle(async () => { throw new Error('boom') })
    await expect(failed).rejects.toThrow('boom')
    await expect(throttle(async () => 'ok')).resolves.toBe('ok')
  })
})

describe('isRateLimitError', () => {
  it('detects a 429 status', () => {
    expect(isRateLimitError({ statusCode: 429 })).toBe(true)
  })

  it('detects rate-limit wording', () => {
    expect(isRateLimitError(new Error('Rate limit exceeded'))).toBe(true)
  })

  it('is false for unrelated errors', () => {
    expect(isRateLimitError(new Error('timeout'))).toBe(false)
  })
})
