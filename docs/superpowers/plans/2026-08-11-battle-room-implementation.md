# battle-room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers-extended-cc:subagent-driven-development (recommended) or superpowers-extended-cc:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy `battle-room`, a Next.js portfolio demo where 4 sequential AI agents scrape a competitor's live ads, draft a battlecard, summarize their media coverage, and write a personalized outbound sequence — real Firecrawl scrapes and real Claude calls, server-side keys, rate-limited to 3 runs/IP/day.

**Architecture:** Next.js App Router on Vercel, same server-side-API-routes pattern as the sibling project `Competitor Gap Analyzer` (Firecrawl + Anthropic keys never reach the client). One page with a 3-field form drives 4 API routes called **sequentially** from the client — each resolves before the next fires, giving the "agents running in order" UI via plain request/response, no SSE needed.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS v4, `@anthropic-ai/sdk`, `@mendable/firecrawl-js`, `@upstash/redis` (optional, falls back to in-memory), deployed on Vercel.

**Testing approach — read before starting:** This project has no automated test suite, matching the established convention in the sibling `Competitor Gap Analyzer` repo (also zero automated tests). The `lib/` modules that talk to Firecrawl/Claude aren't meaningfully unit-testable without heavy mocking that wouldn't catch real integration bugs anyway. Verification is: `npx tsc --noEmit` for type safety after every task, plus real `curl` calls against the dev server (with real API keys in `.env.local`) for every API route, plus a full manual browser pass at the end. This is a deliberate, spec-approved deviation from this skill's default TDD template — not an oversight.

---

### Task 1: Project scaffold

**Goal:** A running Next.js app with the design system's tokens in place and a placeholder page, so every later task can be visually verified against real styling.

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `.gitignore`
- Create: `.env.local.example`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `app/page.tsx`

**Acceptance Criteria:**
- [ ] `npm install` completes with no errors
- [ ] `npm run dev` serves a page at `http://localhost:3000` showing the "battle-room" placeholder heading styled with the Alpine Green accent
- [ ] `npm run build` completes with no errors

**Verify:** `npm install && npm run build` → build succeeds with no type or lint errors

**Steps:**

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "battle-room",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.115.0",
    "@mendable/firecrawl-js": "^4.31.1",
    "@upstash/redis": "^1.38.0",
    "@vercel/analytics": "^2.0.1",
    "next": "^15.5.22",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.3.6",
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "^15.5.22",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Create `eslint.config.mjs`**

```js
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
```

- [ ] **Step 6: Create `.gitignore`**

```
# dependencies
/node_modules

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*
!.env.local.example

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

- [ ] **Step 7: Create `.env.local.example`**

```
ANTHROPIC_API_KEY=
# Optional — falls back to a default model when unset.
ANTHROPIC_MODEL=
# Required — every scrape goes through Firecrawl, no plain-fetch fallback.
FIRECRAWL_API_KEY=
# Optional — without these, caching and rate limiting fall back to an
# in-memory store (works, but resets on redeploy and isn't shared across
# serverless instances).
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- [ ] **Step 8: Create `app/globals.css`**

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --surface: #f5f5f7;
  --foreground: #1d1d1f;
  --muted: #6e6e73;
  --border: #d2d2d7;
  --accent: #1e3a2f;
  --accent-text: #16291f;
  --accent-tint: #e8f0ec;
  --bad: #d14343;
  --bad-tint: #fbeaea;
  --warn: #b8791f;
  --warn-tint: #faf1e0;
  --font-sans: -apple-system, BlinkMacSystemFont, var(--font-onest), "Helvetica Neue", sans-serif;
  --shadow-sm: 0 1px 2px rgba(29, 29, 31, 0.05), 0 1px 1px rgba(29, 29, 31, 0.03);
  --shadow-md: 0 8px 24px -8px rgba(29, 29, 31, 0.1), 0 2px 8px -2px rgba(29, 29, 31, 0.05);
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-text: var(--accent-text);
  --color-accent-tint: var(--accent-tint);
  --color-bad: var(--bad);
  --color-bad-tint: var(--bad-tint);
  --color-warn: var(--warn);
  --color-warn-tint: var(--warn-tint);
  --font-sans: var(--font-sans);
  --shadow-soft: var(--shadow-sm);
  --shadow-elevated: var(--shadow-md);
}

html {
  color-scheme: light;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.5;
}
```

- [ ] **Step 9: Create `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "battle-room — AI Agent Orchestration Demo",
  description:
    "Four AI agents that scrape a competitor's live ads, draft a battlecard, summarize their media coverage, and write an outbound sequence — live, in sequence.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${onest.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

- [ ] **Step 10: Create `app/page.tsx` (placeholder, replaced in Task 11)**

```tsx
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-4 px-6 py-24">
      <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--accent-text)]">
        AI Agent Orchestration
      </p>
      <h1 className="text-[40px] font-semibold leading-tight text-[var(--foreground)]">
        battle-room
      </h1>
    </main>
  );
}
```

- [ ] **Step 11: Install and verify**

Run: `npm install && npm run build`
Expected: build completes, no errors.

- [ ] **Step 12: Commit**

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs eslint.config.mjs .gitignore .env.local.example app/
git commit -m "Scaffold Next.js app with design tokens"
```

---

### Task 2: Rate limiting and caching (`lib/cache.ts`, `lib/rateLimit.ts`, `lib/getClientIp.ts`)

**Goal:** A per-IP daily rate limit (3 runs/day) backed by Upstash when configured, in-memory otherwise — same pattern as `Competitor Gap Analyzer`.

**Files:**
- Create: `lib/cache.ts`
- Create: `lib/getClientIp.ts`
- Create: `lib/rateLimit.ts`

**Acceptance Criteria:**
- [ ] `checkRateLimit(ip)` throws `RateLimitError` on the 4th call within the same day for the same IP
- [ ] Works with no Upstash env vars set (in-memory fallback)
- [ ] Type-checks cleanly

**Verify:** `npx tsc --noEmit` → no errors

**Steps:**

- [ ] **Step 1: Create `lib/cache.ts`**

```ts
interface CacheStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
}

class MemoryCache implements CacheStore {
  private store = new Map<string, { value: string; expiresAt: number }>()

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
  }
}

class UpstashCache implements CacheStore {
  private redisPromise: Promise<import('@upstash/redis').Redis>

  constructor() {
    this.redisPromise = import('@upstash/redis').then(
      ({ Redis }) =>
        new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL!,
          token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        })
    )
  }

  async get(key: string): Promise<string | null> {
    const redis = await this.redisPromise
    const value = await redis.get<string>(key)
    return value ?? null
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const redis = await this.redisPromise
    await redis.set(key, value, { ex: ttlSeconds })
  }
}

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
)

export const cache: CacheStore = hasUpstash ? new UpstashCache() : new MemoryCache()
```

- [ ] **Step 2: Create `lib/getClientIp.ts`**

```ts
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
```

- [ ] **Step 3: Create `lib/rateLimit.ts`**

```ts
import { cache } from './cache'

const MAX_RUNS_PER_DAY = 3
const DAY_SECONDS = 60 * 60 * 24

export class RateLimitError extends Error {
  constructor() {
    super('Rate limit exceeded: max 3 pipeline runs per day per IP. Try again tomorrow.')
    this.name = 'RateLimitError'
  }
}

function currentDayBucket(): string {
  return Math.floor(Date.now() / (DAY_SECONDS * 1000)).toString()
}

export async function checkRateLimit(ip: string): Promise<void> {
  const key = `battleroom:ratelimit:${ip}:${currentDayBucket()}`
  const current = await cache.get(key)
  const count = current ? parseInt(current, 10) : 0

  if (count >= MAX_RUNS_PER_DAY) {
    throw new RateLimitError()
  }

  await cache.set(key, String(count + 1), DAY_SECONDS)
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/cache.ts lib/getClientIp.ts lib/rateLimit.ts
git commit -m "Add per-IP daily rate limiting with Upstash/in-memory cache"
```

---

### Task 3: Claude wrapper (`lib/claude.ts`)

**Goal:** A single gateway every agent uses to call Claude, so the model/config lives in one place.

**Files:**
- Create: `lib/claude.ts`

**Acceptance Criteria:**
- [ ] `askClaude(systemPrompt, userPrompt)` returns the trimmed text of Claude's response
- [ ] Throws a clear error if `ANTHROPIC_API_KEY` is unset
- [ ] Respects `ANTHROPIC_MODEL` env override, defaults to `claude-sonnet-5`

**Verify:** `npx tsc --noEmit` → no errors

**Steps:**

- [ ] **Step 1: Create `lib/claude.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1024

let anthropicClient: Anthropic | null = null

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set')
    }
    anthropicClient = new Anthropic({ apiKey })
  }
  return anthropicClient
}

/**
 * Single gateway to Claude for every agent. Each agent supplies its own
 * system prompt (persona + hard rules) and user prompt (the task + data).
 * Returns the first text block, trimmed.
 */
export async function askClaude(systemPrompt: string, userPrompt: string): Promise<string> {
  const client = getAnthropicClient()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

  const response = await client.messages.create({
    model,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Claude response contained no text block')
  }

  return textBlock.text.trim()
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/claude.ts
git commit -m "Add Claude wrapper shared by all agents"
```

---

### Task 4: Firecrawl wrapper (`lib/firecrawl.ts`)

**Goal:** Scrape the public Meta Ad Library and Google News search pages for a brand, returning trimmed markdown or `null` if nothing usable was found — callers never see a thrown error from this module.

**Files:**
- Create: `lib/firecrawl.ts`

**Acceptance Criteria:**
- [ ] `scrapeAdLibrary(brand)` and `scrapeMediaCoverage(brand)` return `string | null`, never throw
- [ ] Results are cached for 1 hour per URL via `lib/cache.ts`
- [ ] Scraped markdown is capped at 15,000 characters before returning

**Verify:** `npx tsc --noEmit` → no errors

**Steps:**

- [ ] **Step 1: Create `lib/firecrawl.ts`**

```ts
import { Firecrawl } from '@mendable/firecrawl-js'
import { cache } from './cache'

const SCRAPE_TIMEOUT_MS = 20_000
const SCRAPE_CACHE_TTL_SECONDS = 60 * 60 // brand ad/news content doesn't need to be fresher than this for a demo tool
const MAX_MARKDOWN_CHARS = 15_000 // keeps scraped content well inside a single Claude prompt

let firecrawlClient: Firecrawl | null = null

function getFirecrawlClient(): Firecrawl {
  if (!firecrawlClient) {
    const apiKey = process.env.FIRECRAWL_API_KEY
    if (!apiKey) {
      throw new Error('FIRECRAWL_API_KEY is not set')
    }
    firecrawlClient = new Firecrawl({ apiKey })
  }
  return firecrawlClient
}

function buildAdLibraryUrl(brand: string): string {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country: 'ALL',
    q: brand,
    search_type: 'keyword_unordered',
    media_type: 'all',
  })
  return `https://www.facebook.com/ads/library/?${params.toString()}`
}

function buildNewsSearchUrl(brand: string): string {
  const params = new URLSearchParams({ q: brand, hl: 'en-US', gl: 'US', ceid: 'US:en' })
  return `https://news.google.com/search?${params.toString()}`
}

/**
 * Scrapes a URL via Firecrawl and returns trimmed markdown, or null if the
 * scrape fails or comes back empty. Callers treat null as "no data found" —
 * this never throws past this boundary, the pipeline must keep going.
 */
async function scrapeMarkdown(url: string): Promise<string | null> {
  const cacheKey = `scrape:${url}`
  const cached = await cache.get(cacheKey)
  if (cached !== null) {
    return cached.length > 0 ? cached : null
  }

  const client = getFirecrawlClient()
  let markdown: string | undefined
  try {
    const doc = await client.scrape(url, {
      formats: ['markdown'],
      timeout: SCRAPE_TIMEOUT_MS,
    })
    markdown = doc.markdown
  } catch (err) {
    console.error(`Firecrawl scrape failed for ${url}:`, err instanceof Error ? err.message : err)
    await cache.set(cacheKey, '', SCRAPE_CACHE_TTL_SECONDS)
    return null
  }

  const trimmed = (markdown ?? '').trim().slice(0, MAX_MARKDOWN_CHARS)
  await cache.set(cacheKey, trimmed, SCRAPE_CACHE_TTL_SECONDS)
  return trimmed.length > 0 ? trimmed : null
}

export async function scrapeAdLibrary(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildAdLibraryUrl(brand))
}

export async function scrapeMediaCoverage(brand: string): Promise<string | null> {
  return scrapeMarkdown(buildNewsSearchUrl(brand))
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/firecrawl.ts
git commit -m "Add Firecrawl wrapper for ad library and news search scraping"
```

---

### Task 5: Agent 1 — Ad Intelligence API route

**Goal:** `POST /api/agents/ads` scrapes the competitor's Meta Ad Library page and returns 3–5 bullet insights, or `found: false` if nothing was there. Also where the daily rate limit is checked (once per pipeline run, at the entry point).

**Files:**
- Create: `app/api/agents/ads/route.ts`

**Acceptance Criteria:**
- [ ] Returns 400 if `competitorBrand` is missing
- [ ] Returns 429 with a clear message if the IP has hit the daily limit
- [ ] Returns `{ found: true, insights: string }` when ads were found
- [ ] Returns `{ found: false, insights: null }` when no ad data was found, without calling Claude to fill the gap
- [ ] Never invents ad content not present in the scraped page (enforced via system prompt)

**Verify:** With `ANTHROPIC_API_KEY` and `FIRECRAWL_API_KEY` set in `.env.local`, run `npm run dev`, then:
```bash
curl -s -X POST http://localhost:3000/api/agents/ads \
  -H "Content-Type: application/json" \
  -d '{"competitorBrand":"Nike"}' | python3 -m json.tool
```
Expected: `found: true` with 3–5 bullet insights in `insights`.

**Steps:**

- [ ] **Step 1: Create `app/api/agents/ads/route.ts`**

```ts
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
  const competitorBrand = body?.competitorBrand as string | undefined

  if (!competitorBrand || typeof competitorBrand !== 'string') {
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

  const scraped = await scrapeAdLibrary(competitorBrand)

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
```

- [ ] **Step 2: Verify with curl**

Run: `npm run dev` (separate terminal), then the curl command from the Verify section above.
Expected: JSON with `found: true` and 3–5 bullets in `insights`. Repeat with `{"competitorBrand":"asdkjhasdkjh"}` and expect `found: false, insights: null`.

- [ ] **Step 3: Verify rate limit**

Run the curl command 4 times in a row.
Expected: first 3 succeed (200), 4th returns 429 with the rate limit message.

- [ ] **Step 4: Commit**

```bash
git add app/api/agents/ads/route.ts
git commit -m "Add Ad Intelligence agent API route"
```

---

### Task 6: Agent 2 — Battlecard Writer API route

**Goal:** `POST /api/agents/battlecard` drafts a positioning/differentiators/objection-handling battlecard from the ad insights (or lack thereof) plus both brand names.

**Files:**
- Create: `app/api/agents/battlecard/route.ts`

**Acceptance Criteria:**
- [ ] Returns 400 if `yourBrand` or `competitorBrand` is missing
- [ ] Returns `{ battlecard: string }` with three headed markdown sections
- [ ] When `adInsights` is `null`, the output plainly states no ad data was available rather than inventing what the competitor's ads might say
- [ ] Never states a specific metric, price, or fact not present in the input (enforced via system prompt)

**Verify:**
```bash
curl -s -X POST http://localhost:3000/api/agents/battlecard \
  -H "Content-Type: application/json" \
  -d '{"yourBrand":"Notion","competitorBrand":"Coda","adInsights":"- Leads with an \"all-in-one workspace\" angle\n- Offers a 30-day free trial in most ads"}' \
  | python3 -m json.tool
```
Expected: `battlecard` contains `## Positioning`, `## Differentiators to lead with`, `## Objection handling` sections.

**Steps:**

- [ ] **Step 1: Create `app/api/agents/battlecard/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { askClaude } from '@/lib/claude'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are a competitive positioning strategist writing a sales battlecard. You are given a company name, a competitor name, and (optionally) a short summary of the competitor's current ad angles.

Write a battlecard with exactly these three sections, each as a heading followed by bullet points:

## Positioning
2-3 bullets on how to frame the company against this specific competitor, given the ad angles (if provided).

## Differentiators to lead with
2-3 bullets naming structural angles a seller could lead with (e.g. category framing, audience focus) based only on what's provided.

## Objection handling
2-3 bullets, each a likely objection a prospect raises after seeing the competitor's ads, paired with a response angle.

Hard rules:
- Never state a specific metric, price, feature spec, or fact about either company that was not given to you in the input. If you don't have enough information for a specific point, write a structural/strategic angle instead (e.g. "lead with category ownership" rather than invented numbers).
- If no ad angle data was provided, say so plainly in the Positioning section and base the rest on general competitive-positioning structure only — do not invent what the competitor's ads might say.
- Output only the three headed sections in markdown. No preamble.`

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const yourBrand = body?.yourBrand as string | undefined
  const competitorBrand = body?.competitorBrand as string | undefined
  const adInsights = (body?.adInsights as string | null | undefined) ?? null

  if (!yourBrand || !competitorBrand) {
    return NextResponse.json({ error: 'Missing "yourBrand" or "competitorBrand".' }, { status: 400 })
  }

  const userPrompt = [
    `Your company: ${yourBrand}`,
    `Competitor: ${competitorBrand}`,
    adInsights
      ? `Competitor's current ad angles:\n${adInsights}`
      : `No competitor ad data was found — write the battlecard using general competitive-positioning structure only.`,
  ].join('\n\n')

  try {
    const battlecard = await askClaude(SYSTEM_PROMPT, userPrompt)
    return NextResponse.json({ battlecard })
  } catch (err) {
    console.error('Battlecard agent failed:', err)
    return NextResponse.json({ error: 'Battlecard agent failed.' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Verify with curl**

Run the curl command from the Verify section above.
Expected: three headed sections present, no invented metrics.

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/battlecard/route.ts
git commit -m "Add Battlecard Writer agent API route"
```

---

### Task 7: Agent 3 — Media Coverage API route

**Goal:** `POST /api/agents/media` scrapes a Google News search for the competitor brand and summarizes recent coverage themes/sentiment.

**Files:**
- Create: `app/api/agents/media/route.ts`

**Acceptance Criteria:**
- [ ] Returns 400 if `competitorBrand` is missing
- [ ] Returns `{ found: true, summary: string }` when coverage was found
- [ ] Returns `{ found: false, summary: null }` when nothing usable was scraped
- [ ] No rate limit check here — already checked once in Agent 1

**Verify:**
```bash
curl -s -X POST http://localhost:3000/api/agents/media \
  -H "Content-Type: application/json" \
  -d '{"competitorBrand":"Nike"}' | python3 -m json.tool
```
Expected: `found: true` with 3–5 bullets in `summary`.

**Steps:**

- [ ] **Step 1: Create `app/api/agents/media/route.ts`**

```ts
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
  const competitorBrand = body?.competitorBrand as string | undefined

  if (!competitorBrand || typeof competitorBrand !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid "competitorBrand".' }, { status: 400 })
  }

  const scraped = await scrapeMediaCoverage(competitorBrand)

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
```

- [ ] **Step 2: Verify with curl**

Run the curl command from the Verify section above.
Expected: `found: true`, 3–5 bullets with a sentiment read.

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/media/route.ts
git commit -m "Add Media Coverage agent API route"
```

---

### Task 8: Agent 4 — Outbound Sequence API route

**Goal:** `POST /api/agents/outbound` drafts a 3-email outbound sequence personalized to the target persona's role, referencing the battlecard's positioning.

**Files:**
- Create: `app/api/agents/outbound/route.ts`

**Acceptance Criteria:**
- [ ] Returns 400 if `battlecard` or `persona` is missing
- [ ] Returns `{ sequence: string }` with exactly 3 `## Email N — [subject]` blocks
- [ ] Never invents a real recipient's name or personal facts (enforced via system prompt — personalization is by role/context only)

**Verify:**
```bash
curl -s -X POST http://localhost:3000/api/agents/outbound \
  -H "Content-Type: application/json" \
  -d '{"battlecard":"## Positioning\n- Lead with all-in-one workspace framing","persona":"Head of Ops at a mid-market SaaS company"}' \
  | python3 -m json.tool
```
Expected: `sequence` contains `## Email 1 —`, `## Email 2 —`, `## Email 3 —`.

**Steps:**

- [ ] **Step 1: Create `app/api/agents/outbound/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { askClaude } from '@/lib/claude'

export const maxDuration = 60

const SYSTEM_PROMPT = `You are an outbound sales copywriter. You are given a sales battlecard (positioning, differentiators, objection handling) and a target buyer persona description. Write a 3-email outbound sequence personalized to that persona's role and context, referencing the positioning angles from the battlecard.

Format exactly as:

## Email 1 — [subject line]
[body]

## Email 2 — [subject line]
[body]

## Email 3 — [subject line]
[body]

Hard rules:
- Personalize by role and context only (the persona's job function, likely priorities, likely pain points implied by that role). Never invent a specific real person's name, company, or personal fact — address them generically (e.g. "Hi there,") rather than with an invented first name.
- Never state a specific metric, price, or fact about either company beyond what's in the battlecard.
- Keep each email under 120 words. No preamble outside the three email blocks.`

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const battlecard = body?.battlecard as string | undefined
  const persona = body?.persona as string | undefined

  if (!battlecard || !persona) {
    return NextResponse.json({ error: 'Missing "battlecard" or "persona".' }, { status: 400 })
  }

  const userPrompt = `Target persona: ${persona}\n\nBattlecard:\n${battlecard}`

  try {
    const sequence = await askClaude(SYSTEM_PROMPT, userPrompt)
    return NextResponse.json({ sequence })
  } catch (err) {
    console.error('Outbound agent failed:', err)
    return NextResponse.json({ error: 'Outbound agent failed.' }, { status: 502 })
  }
}
```

- [ ] **Step 2: Verify with curl**

Run the curl command from the Verify section above.
Expected: 3 email blocks, no invented recipient name.

- [ ] **Step 3: Commit**

```bash
git add app/api/agents/outbound/route.ts
git commit -m "Add Outbound Sequence agent API route"
```

---

### Task 9: `AgentCard` component

**Goal:** The visual unit of the pipeline — one card showing an agent's icon/index, name, status, and (when done/empty/error) its expanded result or a retry button.

**Files:**
- Create: `components/AgentCard.tsx`

**Acceptance Criteria:**
- [ ] Renders 5 distinct visual states: `idle`, `running` (pulsing accent), `done` (expanded result), `empty` (explicit "no data" message), `error` (message + retry button)
- [ ] `done` state renders `##` lines as subheadings and `- ` lines as bullets, using the Alpine Green tokens from `globals.css`
- [ ] Type-checks cleanly

**Verify:** `npx tsc --noEmit` → no errors (full visual verification happens in Task 11 once wired into the page)

**Steps:**

- [ ] **Step 1: Create `components/AgentCard.tsx`**

```tsx
export type AgentStatus = 'idle' | 'running' | 'done' | 'empty' | 'error'

interface AgentCardProps {
  index: number
  title: string
  description: string
  status: AgentStatus
  result: string | null
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
}

const STATUS_LABEL: Record<AgentStatus, string> = {
  idle: 'Waiting',
  running: 'Running',
  done: 'Done',
  empty: 'No data found',
  error: 'Failed',
}

function renderFormatted(text: string) {
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      return (
        <h4 key={i} className="mt-4 mb-1 text-[13px] font-semibold text-[var(--foreground)] first:mt-0">
          {trimmed.slice(3)}
        </h4>
      )
    }
    if (trimmed.startsWith('- ')) {
      return (
        <p
          key={i}
          className="relative pl-4 text-[14px] leading-relaxed text-[var(--foreground)] before:absolute before:left-0 before:text-[var(--muted)] before:content-['–']"
        >
          {trimmed.slice(2)}
        </p>
      )
    }
    if (trimmed.length === 0) return null
    return (
      <p key={i} className="text-[14px] leading-relaxed text-[var(--foreground)]">
        {trimmed}
      </p>
    )
  })
}

export function AgentCard({
  index,
  title,
  description,
  status,
  result,
  emptyMessage,
  errorMessage,
  onRetry,
}: AgentCardProps) {
  const isActive = status !== 'idle'

  const badgeClass =
    status === 'done'
      ? 'bg-[var(--accent)] text-white'
      : status === 'running'
        ? 'animate-pulse bg-[var(--accent-tint)] text-[var(--accent-text)]'
        : status === 'error'
          ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
          : 'border border-[var(--border)] bg-white text-[var(--muted)]'

  const pillClass =
    status === 'done' || status === 'running'
      ? 'bg-[var(--accent-tint)] text-[var(--accent-text)]'
      : status === 'error'
        ? 'bg-[var(--bad-tint)] text-[var(--bad)]'
        : status === 'empty'
          ? 'bg-[var(--surface)] text-[var(--muted)]'
          : 'border border-[var(--border)] bg-white text-[var(--muted)]'

  return (
    <div
      className={`rounded-[20px] border p-5 transition-all duration-300 ${
        isActive ? 'border-[var(--accent)]/30 bg-white shadow-[var(--shadow-elevated)]' : 'border-[var(--border)] bg-[var(--surface)]'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${badgeClass}`}>
            {index}
          </div>
          <div>
            <p className="text-[15px] font-semibold text-[var(--foreground)]">{title}</p>
            <p className="text-[13px] text-[var(--muted)]">{description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[12px] font-medium ${pillClass}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>

      {status === 'done' && result && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">{renderFormatted(result)}</div>
      )}

      {status === 'empty' && (
        <p className="mt-4 border-t border-[var(--border)] pt-4 text-[14px] text-[var(--muted)]">
          {emptyMessage ?? 'No data found for this input.'}
        </p>
      )}

      {status === 'error' && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <p className="text-[14px] text-[var(--bad)]">{errorMessage ?? 'Something went wrong.'}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--accent)]"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/AgentCard.tsx
git commit -m "Add AgentCard component with 5 visual states"
```

---

### Task 10: `PipelineForm` component

**Goal:** The 3-field input form (your brand, competitor brand, target persona) that kicks off the pipeline.

**Files:**
- Create: `components/PipelineForm.tsx`

**Acceptance Criteria:**
- [ ] Submit button is disabled until all 3 fields are non-empty
- [ ] Submit button and all inputs are disabled while `disabled` prop is true (pipeline running)
- [ ] Calls `onSubmit` with trimmed field values

**Verify:** `npx tsc --noEmit` → no errors

**Steps:**

- [ ] **Step 1: Create `components/PipelineForm.tsx`**

```tsx
'use client'

import { useState, type FormEvent } from 'react'

export interface PipelineInputs {
  yourBrand: string
  competitorBrand: string
  persona: string
}

interface PipelineFormProps {
  onSubmit: (inputs: PipelineInputs) => void
  disabled: boolean
}

export function PipelineForm({ onSubmit, disabled }: PipelineFormProps) {
  const [yourBrand, setYourBrand] = useState('')
  const [competitorBrand, setCompetitorBrand] = useState('')
  const [persona, setPersona] = useState('')

  const canSubmit =
    yourBrand.trim().length > 0 && competitorBrand.trim().length > 0 && persona.trim().length > 0 && !disabled

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({ yourBrand: yourBrand.trim(), competitorBrand: competitorBrand.trim(), persona: persona.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Your brand</span>
        <input
          value={yourBrand}
          onChange={(e) => setYourBrand(e.target.value)}
          placeholder="e.g. Notion"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Competitor brand</span>
        <input
          value={competitorBrand}
          onChange={(e) => setCompetitorBrand(e.target.value)}
          placeholder="e.g. Coda"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-[var(--muted)]">Target persona</span>
        <input
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="e.g. Head of Ops at a mid-market SaaS company"
          disabled={disabled}
          className="rounded-[14px] border border-[var(--border)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--foreground)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-50"
        />
      </label>
      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {disabled ? 'Running…' : 'Run the pipeline'}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/PipelineForm.tsx
git commit -m "Add PipelineForm component"
```

---

### Task 11: `PipelineRunner` orchestration + wire into `app/page.tsx`

**Goal:** Sequentially call all 4 agent routes, updating each `AgentCard`'s state as it runs; support per-agent retry without restarting the whole pipeline; surface the rate-limit message distinctly from a per-agent error. Replace the placeholder `app/page.tsx` with the real page.

**Files:**
- Create: `components/PipelineRunner.tsx`
- Modify: `app/page.tsx` (replace placeholder body from Task 1, Step 10)

**Acceptance Criteria:**
- [ ] Submitting the form runs Agent 1 → 2 → 3 → 4 in order, each card transitioning `idle → running → done|empty|error` as its call resolves
- [ ] A 429 from Agent 1 shows a page-level rate-limit message and leaves the pipeline un-started (card stays `idle`), not a per-card error
- [ ] An error in Agent 2 (battlecard) still lets Agent 3 (media) run — Agent 3 doesn't depend on the battlecard — but Agent 4 does not run since it needs the battlecard
- [ ] Each `error` card's retry button re-runs only that agent, reusing already-produced upstream results (e.g. retrying Agent 4 reuses the existing battlecard, does not re-scrape or re-call Agent 1–3)
- [ ] The form is disabled while any agent is `running`

**Verify:** Manual browser test — see Steps 2–4 below.

**Steps:**

- [ ] **Step 1: Create `components/PipelineRunner.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { AgentCard, type AgentStatus } from './AgentCard'
import { PipelineForm, type PipelineInputs } from './PipelineForm'

interface AgentSlot {
  status: AgentStatus
  result: string | null
  errorMessage?: string
}

interface AgentRunResult extends Partial<AgentSlot> {
  rateLimited?: boolean
}

const IDLE_SLOT: AgentSlot = { status: 'idle', result: null }

const AGENT_META = [
  { title: 'Ad Intelligence', description: "Scrapes the competitor's live ads and extracts their angles." },
  { title: 'Battlecard Writer', description: 'Drafts your positioning against this competitor.' },
  { title: 'Media Coverage', description: "Summarizes the competitor's recent press." },
  { title: 'Outbound Sequence', description: 'Writes a 3-email sequence for your target persona.' },
] as const

async function callAgent<T>(
  url: string,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok) {
      return { ok: false, error: data?.error ?? 'Request failed.', status: res.status }
    }
    return { ok: true, data: data as T }
  } catch {
    return { ok: false, error: 'Network error.', status: 0 }
  }
}

async function runAdsAgent(competitorBrand: string): Promise<AgentRunResult> {
  const res = await callAgent<{ found: boolean; insights: string | null }>('/api/agents/ads', { competitorBrand })
  if (!res.ok) {
    if (res.status === 429) return { status: 'idle', rateLimited: true, errorMessage: res.error }
    return { status: 'error', errorMessage: res.error }
  }
  return res.data.found ? { status: 'done', result: res.data.insights } : { status: 'empty', result: null }
}

async function runBattlecardAgent(
  yourBrand: string,
  competitorBrand: string,
  adInsights: string | null
): Promise<AgentRunResult> {
  const res = await callAgent<{ battlecard: string }>('/api/agents/battlecard', {
    yourBrand,
    competitorBrand,
    adInsights,
  })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return { status: 'done', result: res.data.battlecard }
}

async function runMediaAgent(competitorBrand: string): Promise<AgentRunResult> {
  const res = await callAgent<{ found: boolean; summary: string | null }>('/api/agents/media', { competitorBrand })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return res.data.found ? { status: 'done', result: res.data.summary } : { status: 'empty', result: null }
}

async function runOutboundAgent(battlecard: string, persona: string): Promise<AgentRunResult> {
  const res = await callAgent<{ sequence: string }>('/api/agents/outbound', { battlecard, persona })
  if (!res.ok) return { status: 'error', errorMessage: res.error }
  return { status: 'done', result: res.data.sequence }
}

export function PipelineRunner() {
  const [inputs, setInputs] = useState<PipelineInputs | null>(null)
  const [slots, setSlots] = useState<[AgentSlot, AgentSlot, AgentSlot, AgentSlot]>([
    IDLE_SLOT,
    IDLE_SLOT,
    IDLE_SLOT,
    IDLE_SLOT,
  ])
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)

  const isRunning = slots.some((s) => s.status === 'running')

  function updateSlot(i: number, patch: AgentRunResult) {
    setSlots((prev) => {
      const next = [...prev] as typeof prev
      next[i] = { ...next[i], ...patch } as AgentSlot
      return next
    })
  }

  async function runPipeline(pipelineInputs: PipelineInputs) {
    setInputs(pipelineInputs)
    setRateLimitMessage(null)
    setSlots([{ ...IDLE_SLOT }, { ...IDLE_SLOT }, { ...IDLE_SLOT }, { ...IDLE_SLOT }])

    updateSlot(0, { status: 'running' })
    const adsResult = await runAdsAgent(pipelineInputs.competitorBrand)
    if (adsResult.rateLimited) {
      setRateLimitMessage(adsResult.errorMessage ?? 'Rate limit reached.')
      updateSlot(0, { status: 'idle' })
      return
    }
    updateSlot(0, adsResult)
    if (adsResult.status === 'error') return

    const adInsights = adsResult.status === 'done' ? (adsResult.result ?? null) : null

    updateSlot(1, { status: 'running' })
    const battlecardResult = await runBattlecardAgent(pipelineInputs.yourBrand, pipelineInputs.competitorBrand, adInsights)
    updateSlot(1, battlecardResult)

    updateSlot(2, { status: 'running' })
    const mediaResult = await runMediaAgent(pipelineInputs.competitorBrand)
    updateSlot(2, mediaResult)

    if (battlecardResult.status !== 'done' || !battlecardResult.result) return

    updateSlot(3, { status: 'running' })
    const outboundResult = await runOutboundAgent(battlecardResult.result, pipelineInputs.persona)
    updateSlot(3, outboundResult)
  }

  async function retryAgent(index: number) {
    if (!inputs) return

    if (index === 0) {
      updateSlot(0, { status: 'running', errorMessage: undefined })
      const result = await runAdsAgent(inputs.competitorBrand)
      if (result.rateLimited) {
        setRateLimitMessage(result.errorMessage ?? 'Rate limit reached.')
        updateSlot(0, { status: 'idle' })
        return
      }
      updateSlot(0, result)
      return
    }

    if (index === 1) {
      const adInsights = slots[0].status === 'done' ? slots[0].result : null
      updateSlot(1, { status: 'running', errorMessage: undefined })
      updateSlot(1, await runBattlecardAgent(inputs.yourBrand, inputs.competitorBrand, adInsights))
      return
    }

    if (index === 2) {
      updateSlot(2, { status: 'running', errorMessage: undefined })
      updateSlot(2, await runMediaAgent(inputs.competitorBrand))
      return
    }

    const battlecard = slots[1].status === 'done' ? slots[1].result : null
    if (!battlecard) return
    updateSlot(3, { status: 'running', errorMessage: undefined })
    updateSlot(3, await runOutboundAgent(battlecard, inputs.persona))
  }

  return (
    <div className="flex flex-col gap-6">
      <PipelineForm onSubmit={runPipeline} disabled={isRunning} />
      {rateLimitMessage && (
        <p className="rounded-[14px] border border-[var(--warn)]/30 bg-[var(--warn-tint)] px-4 py-3 text-[14px] text-[var(--warn)]">
          {rateLimitMessage}
        </p>
      )}
      {inputs && (
        <div className="grid gap-4">
          {slots.map((slot, i) => (
            <AgentCard
              key={AGENT_META[i].title}
              index={i + 1}
              title={AGENT_META[i].title}
              description={AGENT_META[i].description}
              status={slot.status}
              result={slot.result}
              errorMessage={slot.errorMessage}
              onRetry={slot.status === 'error' ? () => retryAgent(i) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Replace `app/page.tsx`**

```tsx
import { PipelineRunner } from '@/components/PipelineRunner'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16 sm:py-24">
      <header className="flex flex-col gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--accent-text)]">
          AI Agent Orchestration
        </p>
        <h1 className="text-[32px] font-semibold leading-tight text-[var(--foreground)] sm:text-[40px]">
          battle-room
        </h1>
        <p className="max-w-xl text-[16px] leading-relaxed text-[var(--muted)]">
          Four agents run in sequence against a real competitor: pulling their live ads, drafting your
          battlecard, reading their recent press, and writing an outbound sequence for your target buyer.
        </p>
      </header>
      <PipelineRunner />
      <footer className="mt-8 border-t border-[var(--border)] pt-6 text-[13px] text-[var(--muted)]">
        Built by Fernando Peccatiello as a portfolio demo. 3 runs per day per visitor.
      </footer>
    </main>
  )
}
```

- [ ] **Step 3: Manual verification — happy path**

Run: `npm run dev`, open `http://localhost:3000`.
Fill in: Your brand = "Notion", Competitor brand = "Nike" (well-known brand with active ads/press), Target persona = "Head of Ops at a mid-market SaaS company". Submit.
Expected: cards 1–4 activate in order, each shows "Running" then expands with its result. Final card shows a 3-email sequence.

- [ ] **Step 4: Manual verification — empty-data and rate-limit paths**

Run the pipeline again with an obscure/nonexistent competitor brand (e.g. "zzqxplaceholder123").
Expected: cards 1 and 3 show "No data found", card 2's battlecard explicitly states no ad data was available, card 4 still produces an outbound sequence from the battlecard.
Then submit the form a 4th time in the same day.
Expected: page-level rate-limit message appears, no cards activate.

- [ ] **Step 5: Commit**

```bash
git add components/PipelineRunner.tsx app/page.tsx
git commit -m "Wire pipeline orchestration into the page"
```

---

### Task 12: README, deploy to GitHub + Vercel

**Goal:** Document the project for future-you, then ship it — new GitHub repo, connected to Vercel with the required env vars set.

**Files:**
- Create: `README.md`

**Acceptance Criteria:**
- [ ] README explains what the tool does, local setup, env vars, and the known limitation that only Agent 1 enforces the rate limit
- [ ] Code pushed to a new GitHub repo
- [ ] Deployed on Vercel with `ANTHROPIC_API_KEY` and `FIRECRAWL_API_KEY` set as production env vars
- [ ] Production URL loads and a real pipeline run succeeds end-to-end

**Verify:** Visit the production Vercel URL, run the pipeline once with a real brand — confirm all 4 cards complete.

**Steps:**

- [ ] **Step 1: Create `README.md`**

```markdown
# battle-room

A portfolio demo of AI agent orchestration: four agents run in sequence to turn a competitor's
name into a live ad-intelligence brief, a battlecard, a media coverage summary, and a personalized
outbound email sequence.

Built after reading a job posting that asked for exactly this pattern — not built for that specific
application, just to show the pattern works.

## How it works

1. **Ad Intelligence** (`api/agents/ads`) — Firecrawl scrapes the public Meta Ad Library search
   results for the competitor brand; Claude extracts 3–5 real ad angles, or reports none were found.
2. **Battlecard Writer** (`api/agents/battlecard`) — Claude drafts positioning, differentiators, and
   objection handling from your brand name + the competitor's ad angles (or a plain "no ad data"
   note if none were found). Never invents metrics or facts not given to it.
3. **Media Coverage** (`api/agents/media`) — Firecrawl scrapes a Google News search for the
   competitor; Claude summarizes recent coverage themes and sentiment.
4. **Outbound Sequence** (`api/agents/outbound`) — Claude writes a 3-email sequence personalized to
   your target persona's role, referencing the battlecard's positioning. Personalizes by role only,
   never invents a real recipient's name.

Each agent's result renders in its own card as the pipeline runs — no data is ever backfilled with
invented content; if a scrape comes back empty, the card says so.

## Local setup

\`\`\`bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY and FIRECRAWL_API_KEY (both required)
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.local.example`](.env.local.example) — `ANTHROPIC_API_KEY` and `FIRECRAWL_API_KEY` are
required, Upstash Redis is optional (falls back to an in-memory cache/rate-limiter otherwise, which
resets on redeploy and isn't shared across serverless instances).

## Rate limiting

3 pipeline runs per IP per day, checked once in the Ad Intelligence route (the pipeline's entry
point). Known limitation: calling `api/agents/battlecard`, `api/agents/media`, or
`api/agents/outbound` directly, without going through `api/agents/ads` first, bypasses this check —
acceptable for a portfolio demo's threat model, would need per-route limiting in a real product.

## Design

Apple-inspired, deliberately distinct from the accent used in [fp-portfolio](../fp-portfolio) so the
two don't read as the same reskinned template side by side: neutral greys (`#ffffff` / `#f5f5f7` /
`#1d1d1f` / `#6e6e73`), Alpine Green accent (`#1E3A2F`, accent text `#16291F`) — pulled from Apple's
own hardware finish palette, same sourcing logic as fp-portfolio's Pacific Blue but a different
finish. SF on Apple platforms via `-apple-system`, Onest elsewhere.

## Structure

\`\`\`
app/
  page.tsx                        → form + pipeline UI
  api/agents/ads/route.ts         → Agent 1: ad intelligence
  api/agents/battlecard/route.ts  → Agent 2: battlecard writer
  api/agents/media/route.ts       → Agent 3: media coverage
  api/agents/outbound/route.ts    → Agent 4: outbound sequence
components/
  PipelineForm.tsx                → the 3-field input form
  AgentCard.tsx                   → one agent's status + result card
  PipelineRunner.tsx              → sequential execution + retry logic
lib/
  firecrawl.ts, claude.ts         → thin wrappers around the two external APIs
  cache.ts, rateLimit.ts, getClientIp.ts → per-IP daily rate limiting
\`\`\`
```

- [ ] **Step 2: Commit the README**

```bash
git add README.md
git commit -m "Add README"
```

- [ ] **Step 3: Create the GitHub repo and push**

Confirm the repo name (`battle-room`) and visibility (public, for the portfolio) with the user before running this — creating a public GitHub repo and pushing code are visible, externally-facing actions.

```bash
gh repo create battle-room --public --source=. --remote=origin --push
```

- [ ] **Step 4: Deploy to Vercel**

Confirm with the user before connecting/deploying — this creates a live public URL.

```bash
npx vercel --prod
```

Then set the required env vars in the Vercel project dashboard (or via `npx vercel env add`):
`ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY` (Upstash vars optional).

- [ ] **Step 5: Verify production**

Visit the production URL, run the pipeline once with a real, well-known brand pair.
Expected: all 4 cards complete with real scraped/generated content.
