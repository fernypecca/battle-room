import { execFile } from 'node:child_process'
import { readFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const run = promisify(execFile)

const GSCRAPE_DIR = process.env.ORPHEUS_DIR ?? `${process.env.HOME}/.claude/scripts/growth-scraper`
const TIMEOUT_MS = 60_000

/**
 * Orpheus (growth-scraper) is the self-hosted scraper we try before spending a
 * Firecrawl credit. It reaches ordinary company sites fine, which is most of
 * the volume — but it is NOT a full replacement:
 *
 *   company site / pricing → works
 *   G2                     → 403, Cloudflare bot mitigation
 *   Trustpilot             → refuses, disallowed by robots.txt
 *
 * So the review sources, which are the product's differentiator, still go
 * through Firecrawl. Returning null here is the normal path, not an error.
 *
 * Two transports. ORPHEUS_URL calls a hosted instance over HTTP and is the
 * only one that can work in production — Vercel functions have no Python, no
 * uv and no Chromium, so the local shell-out below fails fast there and the
 * caller falls through to Firecrawl exactly as it did before.
 */
export async function tryOrpheus(url: string, maxChars: number): Promise<string | null> {
  const endpoint = process.env.ORPHEUS_URL
  return endpoint ? viaHttp(endpoint, url, maxChars) : viaShell(url, maxChars)
}

/** Contract for the hosted instance: POST {url, maxChars} -> {text}. */
async function viaHttp(endpoint: string, url: string, maxChars: number): Promise<string | null> {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.ORPHEUS_TOKEN ? { authorization: `Bearer ${process.env.ORPHEUS_TOKEN}` } : {}),
      },
      body: JSON.stringify({ url, maxChars }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!res.ok) return null

    const data = (await res.json()) as { text?: unknown }
    return typeof data.text === 'string' && data.text.trim().length > 0 ? data.text.trim() : null
  } catch (err) {
    console.warn(`Orpheus (http) could not read ${url}:`, err instanceof Error ? err.message : err)
    return null
  }
}

async function viaShell(url: string, maxChars: number): Promise<string | null> {
  const out = join(tmpdir(), `orpheus-${Date.now()}-${Math.random().toString(36).slice(2)}.jsonl`)

  try {
    await run('uv', ['run', 'gscrape', url, '--max-text-chars', String(maxChars), '-o', out], {
      cwd: GSCRAPE_DIR,
      timeout: TIMEOUT_MS,
    })

    const line = (await readFile(out, 'utf8')).split('\n').find((l) => l.trim().length > 0)
    if (!line) return null

    const record = JSON.parse(line) as { text?: unknown; protectionBlocked?: boolean; error?: string }
    if (record.protectionBlocked || record.error) return null

    return typeof record.text === 'string' && record.text.trim().length > 0 ? record.text.trim() : null
  } catch {
    // ENOENT on `uv` is the expected outcome on Vercel, not a fault worth
    // logging on every single scrape. Quietly fall through to Firecrawl.
    return null
  } finally {
    await unlink(out).catch(() => {})
  }
}
