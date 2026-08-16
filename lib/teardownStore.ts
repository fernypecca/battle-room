import { cache } from './cache'
import type { Teardown } from './synthesize'

const TTL_SECONDS = 60 * 60 * 24 * 7

// Bumped to v2 to retire teardowns generated before the scrape-windowing fix.
// Those were cached with a permanently empty "what their customers say"
// section, and since the store is keyed only by slug nothing else would have
// evicted them for a week. Bump this whenever a change makes existing stored
// teardowns wrong rather than merely older.
const KEY = (slug: string) => `teardown:v2:${slug}`
const INDEX_KEY = 'teardown:v2:index'

export async function getTeardown(slug: string): Promise<Teardown | null> {
  const raw = await cache.get(KEY(slug))
  if (!raw) return null
  try {
    return JSON.parse(raw) as Teardown
  } catch {
    return null
  }
}

export async function saveTeardown(teardown: Teardown): Promise<void> {
  await cache.set(KEY(teardown.slug), JSON.stringify(teardown), TTL_SECONDS)

  // Index entries outlive the teardown itself so the public library keeps
  // listing a company after its cached report has expired and needs a rerun.
  const existing = await cache.get(INDEX_KEY)
  const slugs: string[] = existing ? (JSON.parse(existing) as string[]) : []
  if (!slugs.includes(teardown.slug)) {
    slugs.push(teardown.slug)
    await cache.set(INDEX_KEY, JSON.stringify(slugs), TTL_SECONDS * 52)
  }
}

export async function listTeardownSlugs(): Promise<string[]> {
  const raw = await cache.get(INDEX_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}
