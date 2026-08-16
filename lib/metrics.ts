import { cache } from './cache'

const PREFIX = 'teardown:metrics'

/**
 * Adoption evidence has to accumulate over months, so these counters exist
 * from the first deploy. Every call is best-effort: a metrics failure must
 * never surface to a user or fail a run.
 */
export async function recordRun(slug: string, country: string | null): Promise<void> {
  try {
    await Promise.all([
      cache.incr(`${PREFIX}:runs:total`),
      cache.incr(`${PREFIX}:slug:${slug}`),
      country ? cache.incr(`${PREFIX}:country:${country}`) : Promise.resolve(0),
    ])
  } catch (err) {
    console.error('metrics failed (ignored):', err)
  }
}

export async function recordCollectorOutcome(source: string, ok: boolean): Promise<void> {
  try {
    await cache.incr(`${PREFIX}:collector:${source}:${ok ? 'ok' : 'fail'}`)
  } catch (err) {
    console.error('metrics failed (ignored):', err)
  }
}
