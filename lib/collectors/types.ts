import type { CollectorResult } from '@/lib/evidence'

export interface Collector {
  source: CollectorResult['source']
  /** Returns evidence, or null meaning "genuinely no data found". Must not throw. */
  collect(slug: string, url: string): Promise<CollectorResult>
}
