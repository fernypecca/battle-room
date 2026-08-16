import type { CollectorResult, Evidence } from '@/lib/evidence'
import type { Collector } from './types'
import { webCollector } from './web'
import { reviewsCollector } from './reviews'
import { adsCollector } from './ads'
import { pressCollector } from './press'

export const ALL_COLLECTORS: Collector[] = [webCollector, reviewsCollector, adsCollector, pressCollector]

/**
 * Collectors are independent by design: they never read each other's output,
 * so one failing source degrades that section only. allSettled enforces that
 * even for a collector that throws instead of returning an error result.
 */
export async function runCollectors(
  slug: string,
  url: string,
  collectors: Collector[] = ALL_COLLECTORS
): Promise<CollectorResult[]> {
  const settled = await Promise.allSettled(collectors.map((c) => c.collect(slug, url)))

  return settled.map((outcome, i) => {
    if (outcome.status === 'fulfilled') return outcome.value
    console.error(`collector ${collectors[i].source} rejected:`, outcome.reason)
    return { source: collectors[i].source, evidence: null, error: 'This source could not be read.' }
  })
}

export function mergeEvidence(results: CollectorResult[]): Evidence[] {
  return results.flatMap((r) => r.evidence ?? [])
}
