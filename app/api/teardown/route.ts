import { NextRequest, NextResponse } from 'next/server'
import { toSlug } from '@/lib/slug'
import { runCollectors, mergeEvidence } from '@/lib/collectors'
import { synthesize } from '@/lib/synthesize'
import { getTeardown, saveTeardown } from '@/lib/teardownStore'
import { checkRateLimit, RateLimitError } from '@/lib/rateLimit'
import { getClientIp } from '@/lib/getClientIp'
import { recordRun, recordCollectorOutcome } from '@/lib/metrics'

// Four collectors, several of them scraping through a 7s throttle — well
// above the 60s the old single-agent routes needed.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const rawUrl = typeof body?.url === 'string' ? body.url.trim() : ''

  const slug = toSlug(rawUrl)
  if (!slug) {
    return NextResponse.json({ error: 'Enter a valid company URL, like notion.so.' }, { status: 400 })
  }

  // Cached teardowns are served before the rate limit is consulted: reading
  // an existing public report costs nothing and should never be throttled.
  const cached = await getTeardown(slug)
  if (cached) return NextResponse.json({ teardown: cached, cached: true })

  try {
    await checkRateLimit(getClientIp(request))
  } catch (err) {
    if (err instanceof RateLimitError) {
      return NextResponse.json({ error: err.message }, { status: 429 })
    }
    throw err
  }

  const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`

  try {
    const results = await runCollectors(slug, normalizedUrl)
    await Promise.all(results.map((r) => recordCollectorOutcome(r.source, r.evidence !== null)))

    const evidence = mergeEvidence(results)
    if (evidence.length === 0) {
      return NextResponse.json(
        { error: 'No public information could be found for that company.' },
        { status: 422 }
      )
    }

    const teardown = await synthesize(slug, normalizedUrl, evidence)
    await saveTeardown(teardown)
    await recordRun(slug, request.headers.get('x-vercel-ip-country'))

    return NextResponse.json({ teardown, cached: false })
  } catch (err) {
    console.error('Teardown generation failed:', err)
    return NextResponse.json({ error: 'Teardown generation failed.' }, { status: 502 })
  }
}
