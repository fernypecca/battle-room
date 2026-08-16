import { scrapeMarkdown } from '@/lib/firecrawl'
import { windowAround } from '@/lib/window'
import { extractQuotes, toEvidence } from './extract'
import type { Collector } from './types'
import type { CollectorResult } from '@/lib/evidence'

const FOCUS =
  'Verbatim sentences written by customers about this product — specific complaints, specific praise, missing features, pricing objections, and comparisons to alternatives. Prefer concrete criticism over generic star-rating summaries.'

// Review pages bury the actual reviews below a wall of navigation, medals
// and star-rating breakdowns — on G2 the first real review sits ~54k chars
// in. Fetch the full page, then window it down around wherever the review
// content actually starts instead of trusting the leading slice.
const REVIEW_MARKERS = [
  /what do you (like|dislike)/i,
  /verified (user|current user)/i,
  /pros and cons/i,
  /★|star rating/i,
]

const REVIEW_WINDOW_CHARS = 15_000

// Set from source validation. G2 was the most reliable and its URL is
// derivable from the slug, so it goes first. Trustpilot works but tripped a
// bot check inconsistently (not by domain), so it is the fallback and leans
// on the retry in lib/firecrawl.ts.
//
// Capterra is deliberately excluded: it returned real reviews, but only at
// capterra.com/p/{id}/{Slug}/reviews/, and that numeric id is not derivable
// from the slug. Resolving it costs an extra scrape against a 10 req/min
// budget to reach a third source when two already clear the bar.
const SOURCES: Array<(slug: string) => string> = [
  (slug) => `https://www.g2.com/products/${slug}/reviews`,
  (slug) => `https://www.trustpilot.com/review/${slug}.com`,
]

export const reviewsCollector: Collector = {
  source: 'reviews',
  async collect(slug: string): Promise<CollectorResult> {
    try {
      for (const buildUrl of SOURCES) {
        const url = buildUrl(slug)
        const full = await scrapeMarkdown(url, { maxChars: 150_000 })
        if (!full) continue
        const scraped = windowAround(full, REVIEW_MARKERS, REVIEW_WINDOW_CHARS)

        const items = await extractQuotes(scraped, FOCUS)
        const evidence = toEvidence('reviews', items, url, new Date().toISOString())
        if (evidence.length > 0) return { source: 'reviews', evidence }
      }

      return { source: 'reviews', evidence: null }
    } catch (err) {
      console.error('reviews collector failed:', err)
      return { source: 'reviews', evidence: null, error: 'Could not read review sites.' }
    }
  },
}
