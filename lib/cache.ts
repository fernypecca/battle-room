interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  incr(key: string): Promise<number>
}

export class MemoryCache implements CacheStore {
  private store = new Map<string, { value: string; expiresAt: number }>()
  private counters = new Map<string, number>()

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
