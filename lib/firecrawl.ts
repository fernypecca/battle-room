import { Firecrawl } from '@mendable/firecrawl-js'
import { cache } from './cache'
import { createThrottle, isRateLimitError } from './throttle'
import { tryOrpheus } from './orpheus'

// 10 req/min measured in validation; 7s leaves headroom for clock skew and
// for other requests from the same deployment.
const scrapeThrottle = createThrottle(7_000)
const MAX_RETRIES = 2

const SCRAPE_TIMEOUT_MS = 20_000
const SCRAPE_CACHE_TTL_SECONDS = 60 * 60 // brand ad/news content doesn't need to be fresher than this for a demo tool
const MAX_MARKDOWN_CHARS = 15_000 // keeps scraped content well inside a single Claude prompt

let firecrawlClient: Firecrawl | null = null

function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is not set')
    }
    firecrawlClient = new Firecrawl({ apiKey })
  }
  return firecrawlClient
}

function buildAdLibraryUrl(brand: string): string {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: 'ALL',
    q: brand,
    search_type: 'keyword_unordered',
    media_type: 'all',
  })
  return `https://www.facebook.com/ads/library/?${params.toString()}`
}

function buildNewsSearchUrl(brand: string): string {
  const params = new URLSearchParams({ q: brand, hl: 'en-US', gl: 'US', ceid: 'US:en' })
  return `https://news.google.com/search?${params.toString()}`
}

/**
 * Scrapes a URL via Firecrawl and returns trimmed markdown, or null if the
 * scrape fails or comes back empty. Callers treat null as "no data found".
 * Never throws for scrape/data failures — the pipeline must keep going.
 * Exception: throws if FIRECRAWL_API_KEY is unset (a deploy misconfiguration,
 * not a per-request scrape failure — this should fail loud, not be silently
 * cached as "no data found" for every brand).
 *
 * A genuinely empty successful scrape IS cached (it's a real fact about the
 * brand); a failed scrape attempt is NOT cached, so a retry or fresh run
 * gets a real second attempt instead of a stale false negative.
 */
export async function scrapeMarkdown(url: string, opts?: { maxChars?: number }): Promise<string | null> {
  const maxChars = opts?.maxChars ?? MAX_MARKDOWN_CHARS
  // The cap is part of the cache key because the cached value is already
  // truncated to it — two callers requesting different sizes for the same
  // URL must not read back a value truncated for the other's cap.
  const cacheKey = `scrape:${maxChars}:${url}`
  const cached = await cache.get(cacheKey)
  if (cached !== null) {
    return cached.length > 0 ? cached : null
  }

  // Tier 1: Orpheus, the self-hosted scraper — free, and not subject to the
  // Firecrawl rate cap. It handles ordinary company sites but is turned away
  // by G2 (Cloudflare) and Trustpilot (robots.txt), so review sources still
  // reach Firecrawl below. Null here is the ordinary path, not a failure.
  const viaOrpheus = await tryOrpheus(url, maxChars)
  if (viaOrpheus) {
    const trimmed = viaOrpheus.slice(0, maxChars)
    await cache.set(cacheKey, trimmed, SCRAPE_CACHE_TTL_SECONDS)
    return trimmed
  }

  // Tier 2: Firecrawl. Paid per page and capped at 10 req/min, hence the
  // throttle and the rate-limit retry.
  const client = getFirecrawlClient()
  let markdown: string | undefined
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const doc = await scrapeThrottle(() =>
        client.scrape(url, { formats: ['markdown'], timeout: SCRAPE_TIMEOUT_MS })
      )
      markdown = doc.markdown
      lastError = undefined
      break
    } catch (err) {
      lastError = err
      if (!isRateLimitError(err) || attempt === MAX_RETRIES) break
      // Exponential backoff on rate limiting specifically — other failures
      // are not worth burning the request budget on.
      await new Promise((r) => setTimeout(r, 5_000 * 2 ** attempt))
    }
  }

  if (lastError !== undefined) {
    // Deliberately not cached: a transient failure (timeout, Firecrawl 5xx,
    // rate limit, network blip) is not the same fact as "this brand has no
    // ads/coverage" and must not be locked in as that for an hour — the next
    // attempt should genuinely hit Firecrawl again.
    console.error(`Firecrawl scrape failed for ${url}:`, lastError instanceof Error ? lastError.message : lastError)
    return null
  }

  const trimmed = (markdown ?? '').trim().slice(0, maxChars)
  await cache.set(cacheKey, trimmed, SCRAPE_CACHE_TTL_SECONDS)
  return trimmed.length > 0 ? trimmed : null
}

export async function scrapeAdLibrary(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildAdLibraryUrl(brand), { maxChars: 150_000 })
}

export async function scrapeMediaCoverage(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildNewsSearchUrl(brand))
}
