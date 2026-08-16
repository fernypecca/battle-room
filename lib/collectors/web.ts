import { scrapeMarkdown } from '@/lib/firecrawl'
import { extractQuotes, toEvidence } from './extract'
import type { Collector } from './types'
import type { CollectorResult, Evidence } from '@/lib/evidence'

const FOCUS =
  'What the company sells, who they say it is for, how they describe themselves in their own words, and any concrete pricing (plan names, prices, billing units, limits).'

export const webCollector: Collector = {
  source: 'web',
  async collect(_slug: string, url: string): Promise<CollectorResult> {
    try {
      const origin = new URL(url).origin
      const [home, pricing] = await Promise.all([
        scrapeMarkdown(origin),
        scrapeMarkdown(`${origin}/pricing`),
      ])

      const evidence: Evidence[] = []
      const fetchedAt = new Date().toISOString()

      if (home) {
        const items = await extractQuotes(home, FOCUS)
        evidence.push(...toEvidence('web', items, origin, fetchedAt))
      }

      if (pricing) {
        const items = await extractQuotes(pricing, FOCUS)
        // Re-key so pricing ids continue after the homepage ids instead of
        // restarting at web-1 and colliding with them.
        const offset = evidence.length
        evidence.push(
          ...toEvidence('web', items, `${origin}/pricing`, fetchedAt).map((e, i) => ({
            ...e,
            id: `web-${offset + i + 1}`,
          }))
        )
      }

      return { source: 'web', evidence: evidence.length > 0 ? evidence : null }
    } catch (err) {
      console.error('web collector failed:', err)
      return { source: 'web', evidence: null, error: 'Could not read their website.' }
    }
  },
}
