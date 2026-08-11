import type { NextRequest } from 'next/server'

// NextRequest has no .ip property (removed upstream) — Vercel and most
// proxies set x-forwarded-for; fall back to a shared bucket if absent
// (e.g. local dev), which just means local requests share one rate limit.
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
