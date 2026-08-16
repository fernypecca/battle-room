import { scrapeAdLibrary } from '@/lib/firecrawl'
import { extractQuotes, toEvidence } from './extract'
import type { Collector } from './types'
import type { CollectorResult } from '@/lib/evidence'

const FOCUS =
  'Ad copy currently running for this brand — headlines, hooks, offers, promotional claims, and calls to action, exactly as written in the ads.'

export const adsCollector: Collector = {
  source: 'ads',
  async collect(slug: string): Promise<CollectorResult> {
    try {
      const scraped = await scrapeAdLibrary(slug)
      if (!scraped) return { source: 'ads', evidence: null }

      const items = await extractQuotes(scraped, FOCUS)
      const evidence = toEvidence('ads', items, `https://www.facebook.com/ads/library/?q=${slug}`, new Date().toISOString())

      return { source: 'ads', evidence: evidence.length > 0 ? evidence : null }
    } catch (err) {
      console.error('ads collector failed:', err)
      return { source: 'ads', evidence: null, error: 'Could not read their active ads.' }
    }
  },
}
