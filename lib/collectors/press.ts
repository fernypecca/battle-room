import { XMLParser } from 'fast-xml-parser'
import type { Collector } from './types'
import type { CollectorResult, Evidence } from '@/lib/evidence'

const MAX_ITEMS = 8

export interface RssItem {
  title: string
  link: string
  pubDate?: string
}

const parser = new XMLParser({ ignoreAttributes: true, trimValues: true })

/**
 * Google News publishes RSS, so press needs no scrape at all — this is both
 * more reliable than scraping the search page and one less Firecrawl call.
 */
export function parseRssItems(xml: string): RssItem[] {
  let parsed: unknown
  try {
    parsed = parser.parse(xml)
  } catch {
    return []
  }

  const channel = (parsed as { rss?: { channel?: { item?: unknown } } })?.rss?.channel
  const raw = channel?.item
  if (!raw) return []

  const list = Array.isArray(raw) ? raw : [raw]

  return list
    .map((item) => {
      const it = item as { title?: unknown; link?: unknown; pubDate?: unknown }
      return {
        title: typeof it.title === 'string' ? it.title : '',
        link: typeof it.link === 'string' ? it.link : '',
        pubDate: typeof it.pubDate === 'string' ? it.pubDate : undefined,
      }
    })
    .filter((item) => item.title.length > 0 && item.link.length > 0)
    .slice(0, MAX_ITEMS)
}

function feedUrl(slug: string): string {
  const params = new URLSearchParams({ q: slug, hl: 'en-US', gl: 'US', ceid: 'US:en' })
  return `https://news.google.com/rss/search?${params.toString()}`
}

export const pressCollector: Collector = {
  source: 'press',
  async collect(slug: string): Promise<CollectorResult> {
    try {
      const res = await fetch(feedUrl(slug), {
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; CompetitorTeardown/1.0)' },
      })
      if (!res.ok) return { source: 'press', evidence: null, error: 'News feed unavailable.' }

      const items = parseRssItems(await res.text())
      if (items.length === 0) return { source: 'press', evidence: null }

      const fetchedAt = new Date().toISOString()
      const evidence: Evidence[] = items.map((item, i) => ({
        id: `press-${i + 1}`,
        source: 'press',
        url: item.link,
        quote: item.pubDate ? `${item.title} (${item.pubDate})` : item.title,
        fetched_at: fetchedAt,
      }))

      return { source: 'press', evidence }
    } catch (err) {
      console.error('press collector failed:', err)
      return { source: 'press', evidence: null, error: 'Could not read news coverage.' }
    }
  },
}
