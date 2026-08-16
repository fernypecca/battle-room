export type EvidenceSource = 'web' | 'reviews' | 'ads' | 'press'

export interface Evidence {
  id: string
  source: EvidenceSource
  url: string
  quote: string
  fetched_at: string
}

export interface CollectorResult {
  source: EvidenceSource
  evidence: Evidence[] | null
  error?: string
}

const CITATION_RE = /\s*\[([a-z]+-\d+)\]/g

/**
 * Strips any [id] the synthesizer emitted that isn't in the collected
 * evidence. Citation integrity is the product's core promise, so it is
 * enforced here in code rather than trusted to the model's own compliance.
 */
export function validateCitations(
  text: string,
  evidence: Evidence[]
): { text: string; dropped: string[] } {
  const known = new Set(evidence.map((e) => e.id))
  const dropped: string[] = []

  const cleaned = text.replace(CITATION_RE, (match, id: string) => {
    if (known.has(id)) return match
    if (!dropped.includes(id)) dropped.push(id)
    return ''
  })

  return { text: cleaned, dropped }
}
