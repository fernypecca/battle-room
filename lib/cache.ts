interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  incr(key: string): Promise<number>
}

/**
 * Next.js compiles route handlers and server components into separate module
 * graphs, so a plain module-level Map gives each of them its OWN cache: a
 * teardown written by POST /api/teardown was invisible to /teardown/[slug],
 * which 404'd. Hanging the maps off globalThis — the standard Next pattern
 * for dev singletons — makes local development actually work.
 *
 * This does not make MemoryCache production-viable. Serverless instances do
 * not share a globalThis either, so a deploy without Upstash still cannot
 * serve a teardown it generated. Upstash is required in production, not
 * optional.
 */
const globalStore = globalThis as typeof globalThis & {
  __teardownCache?: Map<string, { value: string; expiresAt: number }>
  __teardownCounters?: Map<string, number>
}

/** Clears the shared dev store. Tests need it because state now outlives an instance. */
export function resetMemoryCache(): void {
  globalStore.__teardownCache?.clear()
  globalStore.__teardownCounters?.clear()
}

export class MemoryCache implements CacheStore {
  private store = (globalStore.__teardownCache ??= new Map())
  private counters = (globalStore.__teardownCounters ??= new Map())

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }

  async incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1
    this.counters.set(key, next)
    return next
  }
}

class UpstashCache implements CacheStore {
  private redisPromise: Promise<import('@upstash/redis').Redis>

  constructor() {
    this.redisPromise = import('@upstash/redis').then(
      ({ Redis }) =>
        new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
    )
  }

  async get(key: string): Promise<string | null> {
    const redis = await this.redisPromise
    const value = await redis.get<string>(key)
    return value ?? null
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const redis = await this.redisPromise
    await redis.set(key, value, { ex: ttlSeconds })
  }

  async incr(key: string): Promise<number> {
    const redis = await this.redisPromise
    return redis.incr(key)
  }
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

export const cache: CacheStore = hasUpstash ? new UpstashCache() : new MemoryCache()
