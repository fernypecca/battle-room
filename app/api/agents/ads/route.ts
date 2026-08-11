import { NextRequest, NextResponse } from 'next/server'
import { scrapeAdLibrary } from '@/lib/firecrawl'
import { askClaude } from '@/lib/claude'
import { checkRateLimit, RateLimitError } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/getClientIp'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a competitive ad intelligence analyst. You are given the raw scraped content of a Meta Ad Library search results page for a brand. Extract 3 to 5 short bullet insights about that brand's current advertising: recurring hooks, angles, offers, or positioning claims you can actually see in the content.

Hard rules:
- Only report what is actually present in the scraped content. Never invent an ad, offer, or claim that isn't there.
- If the content contains no recognizable ad copy for this brand (e.g. the page is empty, blocked, or unrelated), respond with exactly: NO_ADS_FOUND
- Output plain bullet points starting with "-", nothing else. No preamble, no headings.`

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const rawBrand = body?.competitorBrand
  const competitorBrand = typeof rawBrand === 'string' ? rawBrand.trim() : ''

  if (!competitorBrand) {
    return NextResponse.json({ error: 'Missing or invalid "competitorBrand".' }, { status: 400 })
  }

  try {
    await checkRateLimit(getClientIp(request))
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    throw err
  }

  let scraped: string | null
  try {
    scraped = await scrapeAdLibrary(competitorBrand)
  } catch (err) {
    console.error('Ad intelligence agent failed (scrape):', err)
    return NextResponse.json({ error: 'Ad intelligence agent failed.' }, { status: 502 })
  }

  if (!scraped) {
    return NextResponse.json({ found: false, insights: null })
  }

  try {
    const result = await askClaude(
      SYSTEM_PROMPT,
      `Brand: ${competitorBrand}\n\nScraped Meta Ad Library content:\n\n${scraped}`
    )

    if (result.trim() === 'NO_ADS_FOUND') {
      return NextResponse.json({ found: false, insights: null })
    }

    return NextResponse.json({ found: true, insights: result })
  } catch (err) {
    console.error('Ad intelligence agent failed:', err)
    return NextResponse.json({ error: 'Ad intelligence agent failed.' }, { status: 502 })
  }
}
