/**
 * A validation spike measured this account at 10 Firecrawl requests/minute,
 * and an unthrottled pass lost 15 of 25 calls. Four collectors running in
 * parallel would burst well past that, so every scrape goes through one
 * serialized queue with a minimum gap between calls.
 *
 * Scope: this is per-process. On serverless it protects a single run, not
 * concurrent runs from different visitors — slug-level caching is what keeps
 * that pressure down, and the retry in firecrawl.ts absorbs what slips through.
 */
export function createThrottle(minIntervalMs: number) {
  let chain: Promise<unknown> = Promise.resolve()
  let lastStart = 0

  return function throttle<T>(task: () => Promise<T>): Promise<T> {
    const result = chain.then(async () => {
      const wait = Math.max(0, lastStart + minIntervalMs - Date.now())
      if (wait > 0) await new Promise((r) => setTimeout(r, wait))
      lastStart = Date.now()
      return task()
    })

    // The queue advances on settle, so one rejected task cannot stall it.
    chain = result.catch(() => {})
    return result as Promise<T>
  }
}

export function isRateLimitError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    if ((err as { statusCode?: number }).statusCode === 429) return true
  }
  const message = err instanceof Error ? err.message : String(err)
  return /rate.?limit|too many requests|\b429\b/i.test(message)
}
