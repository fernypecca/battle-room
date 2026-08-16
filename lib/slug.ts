const COMMON_SUBDOMAINS = new Set(['www', 'app', 'get', 'go', 'try', 'my', 'web'])

/**
 * Canonical public identity for a competitor: notion.so and
 * https://www.notion.so/pricing both resolve to "notion".
 *
 * Known trade-off: two different companies sharing a first label
 * (notion.so vs notion.com) would collide. Accepted at this scale —
 * revisit if it ever actually happens.
 */
export function toSlug(input: string): string | null {
  const raw = input.trim()
  if (!raw) return null

  let hostname: string
  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    hostname = new URL(withProtocol).hostname.toLowerCase()
  } catch {
    return null
  }

  const labels = hostname.split('.').filter(Boolean)
  if (labels.length < 2) return null

  if (labels.length > 2 && COMMON_SUBDOMAINS.has(labels[0])) labels.shift()
  if (labels[0] === 'www') labels.shift()

  const slug = labels[0]
  return /^[a-z0-9-]+$/.test(slug) ? slug : null
}
