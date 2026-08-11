import { Firecrawl } from '@mendable/firecrawl-js'
import { cache } from './cache'

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
 * scrape fails or comes back empty. Callers treat null as "no data found" —
 * this never throws past this boundary, the pipeline must keep going.
 */
async function scrapeMarkdown(url: string): Promise<string | null> {
  const cacheKey = `scrape:${url}`
  const cached = await cache.get(cacheKey)
  if (cached !== null) {
    return cached.length > 0 ? cached : null
  }

  const client = getFirecrawlClient()
  let markdown: string | undefined
  try {
    const doc = await client.scrape(url, {
      formats: ['markdown'],
      timeout: SCRAPE_TIMEOUT_MS,
    })
    markdown = doc.markdown
  } catch (err) {
    console.error(`Firecrawl scrape failed for ${url}:`, err instanceof Error ? err.message : err)
    await cache.set(cacheKey, '', SCRAPE_CACHE_TTL_SECONDS)
    return null
  }

  const trimmed = (markdown ?? '').trim().slice(0, MAX_MARKDOWN_CHARS)
  await cache.set(cacheKey, trimmed, SCRAPE_CACHE_TTL_SECONDS)
  return trimmed.length > 0 ? trimmed : null
}

export async function scrapeAdLibrary(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildAdLibraryUrl(brand))
}

export async function scrapeMediaCoverage(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildNewsSearchUrl(brand))
}
