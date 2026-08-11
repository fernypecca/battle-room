import { NextRequest, NextResponse } from 'next/server'
import { scrapeMediaCoverage } from '@/lib/firecrawl'
import { askClaude } from '@/lib/claude'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a media monitoring analyst. You are given the raw scraped content of a Google News search results page for a brand. Summarize the recent coverage in 3 to 5 short bullets: recurring themes, and a general sentiment read (positive, neutral, negative, or mixed) per theme.

Hard rules:
- Only summarize what is actually present in the scraped content. Never invent a headline, article, or event that isn't there.
- If the content contains no recognizable news coverage for this brand, respond with exactly: NO_COVERAGE_FOUND
- Output plain bullet points starting with "-", nothing else. No preamble, no headings.`

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const rawBrand = body?.competitorBrand
  const competitorBrand = typeof rawBrand === 'string' ? rawBrand.trim() : ''

  if (!competitorBrand) {
    return NextResponse.json({ error: 'Missing or invalid "competitorBrand".' }, { status: 400 })
  }

  let scraped: string | null
  try {
    scraped = await scrapeMediaCoverage(competitorBrand)
  } catch (err) {
    console.error('Media coverage agent failed (scrape):', err)
    return NextResponse.json({ error: 'Media coverage agent failed.' }, { status: 502 })
  }

  if (!scraped) {
    return NextResponse.json({ found: false, summary: null })
  }

  try {
    const result = await askClaude(
      SYSTEM_PROMPT,
      `Brand: ${competitorBrand}\n\nScraped Google News content:\n\n${scraped}`
    )

    if (result.trim() === 'NO_COVERAGE_FOUND') {
      return NextResponse.json({ found: false, summary: null })
    }

    return NextResponse.json({ found: true, summary: result })
  } catch (err) {
    console.error('Media coverage agent failed:', err)
    return NextResponse.json({ error: 'Media coverage agent failed.' }, { status: 502 })
  }
}
