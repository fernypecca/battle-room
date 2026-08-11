import type { NextRequest } from 'next/server'

// NextRequest has no .ip property (removed upstream) — Vercel and most
// proxies set x-forwarded-for; fall back to a shared bucket if absent
// (e.g. local dev), which just means local requests share one rate limit.
export function getClientIp(request: NextRequest): string {
  // Trust Vercel's edge to set/overwrite x-forwarded-for (not pass-through from client).
  // Pattern mirrors sibling project (Competitor Gap Analyzer) production code.
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
