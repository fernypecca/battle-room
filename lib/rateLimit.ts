import { cache } from './cache'

const MAX_RUNS_PER_DAY = 3
const DAY_SECONDS = 60 * 60 * 24

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded: max 3 pipeline runs per day per IP. Try again tomorrow.')
    this.name = 'RateLimitError'
  }
}

function currentDayBucket(): string {
  return Math.floor(Date.now() / (DAY_SECONDS * 1000)).toString()
}

export async function checkRateLimit(ip: string): Promise<void> {
  const key = `battleroom:ratelimit:${ip}:${currentDayBucket()}`
  const current = await cache.get(key)
  const count = current ? parseInt(current, 10) : 0

  if (count >= MAX_RUNS_PER_DAY) {
    throw new RateLimitError()
  }

  await cache.set(key, String(count + 1), DAY_SECONDS)
}
