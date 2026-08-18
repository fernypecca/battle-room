# Competitor Teardown

Paste a competitor's URL. Get a report on what they sell, what they charge, what their customers
say, what they're advertising, and where they're vulnerable — every sentence carrying a citation
you can open to read the exact source text it came from.

(Repo is named `v2-claude` — `growth-agent-orchestrator` was already taken by another project on
this account. The product itself is titled Competitor Teardown.)

## The guarantee

No sentence in a report renders without a source the reader can open. That's enforced two ways.

First, the synthesizer's system prompt (`lib/synthesize.ts`) requires every claim to end with an
evidence id — `They charge per seat [web-2].` — and forbids stating anything not traceable to a
collected quote.

Second, and this is the part that actually matters: the prompt is not trusted to hold.
`validateCitations` (`lib/evidence.ts`) runs after the model responds and strips, in code, any
`[id]` the model cited that doesn't correspond to a piece of evidence that was actually collected.
Dropped ids are logged and recorded on the teardown (`dropped_citations`). The guarantee doesn't
depend on the model policing itself — it depends on a regex that either finds the id in the
evidence list or deletes it.

## Architecture

Four collectors run independently under `Promise.allSettled` (`lib/collectors/index.ts`), each
returning typed `Evidence[]` or `null` — never prose — which are merged and handed to one
synthesizer:

```
lib/collectors/web.ts      → company site + /pricing
lib/collectors/reviews.ts  → G2, then Trustpilot
lib/collectors/ads.ts      → Meta Ad Library
lib/collectors/press.ts    → Google News RSS
                                  ↓
                         mergeEvidence()
                                  ↓
                      lib/synthesize.ts (one Claude call, tool use)
                                  ↓
                    validateCitations() strips unearned ids
```

This shape is deliberate, not incidental:

- **Collectors never read each other's output.** A failed source degrades its own section only —
  if reviews.ts comes back `null`, the report just has an empty "what customers say" section, and
  the other three still run.
- **Scraped text reaches the model exactly once.** It's attacker-controllable (it's someone else's
  web page), so it goes in delimited and labelled `--- BEGIN UNTRUSTED SCRAPED CONTENT ---` /
  `--- END ---` (`lib/collectors/extract.ts`) for a single extraction pass, not laundered through a
  chain of agents that each re-read and re-emit the previous one's prose. Fewer hops, fewer chances
  for an instruction hidden in a page to survive into the output.

Extraction itself is a second Claude call per source (`lib/collectors/extract.ts`): given raw
scraped markdown and a focus (e.g. "verbatim sentences about pricing"), it returns only quotes that
appear word-for-word in the input, via tool use rather than a prompt asking for JSON — reviews and
ad copy are full of quotation marks and line breaks that reliably broke a model hand-writing JSON
around them.

## Scraping tiers

Every scrape (`lib/firecrawl.ts`) tries Orpheus first, then falls back to Firecrawl. Orpheus is
growth-scraper, a separate self-hosted scraping project, run locally via `uv run gscrape`
(`lib/orpheus.ts`) — free, and not subject to Firecrawl's rate cap.

The split was measured, not assumed:

- Orpheus reads ordinary company sites fine — `linear.app` returned 14.5k chars, `figma.com/pricing`
  32k.
- G2 returns 403 (Cloudflare bot mitigation).
- Trustpilot refuses — disallowed by `robots.txt`.
- So review sources, the product's most useful evidence, still go through Firecrawl.
- A full `figma.com` teardown run went from 47s to 17.6s with identical evidence once Orpheus
  started serving the web-collector calls.

**In production nothing changes yet.** Vercel functions have no Python, no `uv`, and no Chromium,
so the local shell-out fails fast there and Firecrawl serves everything, same as before Orpheus
existed. Setting `ORPHEUS_URL` switches `tryOrpheus` to an HTTP transport against a hosted instance
— no code change, just an env var.

Firecrawl itself is throttled to one request every 7 seconds (`lib/throttle.ts`) — a validation
spike measured this account at 10 req/min and an unthrottled pass lost 15 of 25 calls to rate
limiting. Scrapes are cached for an hour (`lib/cache.ts`); a real empty result is cached, a failed
attempt is not, so a transient timeout gets a genuine retry instead of being locked in as "no data"
for an hour.

## Local setup

```bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY and FIRECRAWL_API_KEY (both required)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.local.example`](.env.local.example):

- `ANTHROPIC_API_KEY` — required.
- `FIRECRAWL_API_KEY` — required, every non-Orpheus scrape goes through Firecrawl.
- `ANTHROPIC_MODEL` — optional, falls back to a default model when unset.
- Redis, either naming — accepted under `KV_REST_API_URL` / `KV_REST_API_TOKEN` (what Vercel's
  Upstash integration injects) or `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (what you
  get provisioning a database directly at upstash.com). `lib/cache.ts` checks both.
- `ORPHEUS_URL`, `ORPHEUS_TOKEN`, `ORPHEUS_DIR` — optional, see Scraping tiers above.

**Redis is required in production, not optional**, despite `.env.local.example` marking it
optional for local dev. `lib/cache.ts` falls back to an in-memory `Map` when Redis isn't
configured, and that module-level store does not survive a serverless invocation — a teardown gets
generated and cached in one function instance, and the next request (including the redirect to its
own `/teardown/[slug]` page) hits a different instance with an empty cache and 404s. The app boots
fine and looks like it works right up until that redirect. `lib/cache.ts` logs a warning at
production boot if Redis isn't configured, but nothing stops the deploy.

## Known limitations

1. **Rate limiting is non-atomic.** `checkRateLimit` (`lib/rateLimit.ts`) does a plain
   get-then-increment against the daily counter — not an atomic `INCR` — so two concurrent requests
   from the same IP can both read the count before either writes it back, letting the 3-runs/day
   cap be briefly exceeded. It's only checked in `app/api/teardown/route.ts`, the single entry
   point. A cached teardown is served before the rate limit is even consulted, which reduces how
   often the race is reachable — a repeat request for an already-known company never touches the
   counter at all — but that's a side effect of the caching order, not a fix for the race itself.
2. **Scraped evidence is untrusted third-party text.** It's passed to the synthesizer and to the
   extraction step under explicit `BEGIN/END UNTRUSTED` delimiters, and both system prompts state
   it's data, not instructions. That's mitigation, not a guarantee — it's a prompt convention, not
   a code-enforced boundary the way citation validation is.
3. **Slug collisions.** `toSlug` (`lib/slug.ts`) keys on the first non-common label of the hostname,
   so `notion.so` and a hypothetical `notion.com` would resolve to the same slug and share a cache
   entry. Called out in the source as an accepted trade-off at this scale.
4. **Capterra is deliberately excluded** from review sources. `lib/collectors/reviews.ts` tries G2
   then Trustpilot only — Capterra does return real reviews, but only at
   `capterra.com/p/{id}/{Slug}/reviews/`, and that numeric id isn't derivable from the slug the way
   the G2 and Trustpilot URLs are. Resolving it would cost an extra scrape against a 10 req/min
   budget to reach a third source when two already clear the bar.
5. **Client IP is read from `x-forwarded-for` with no further validation** (`lib/getClientIp.ts`).
   Fine behind Vercel's edge, which sets the header itself; not something to trust behind an
   arbitrary reverse proxy.

## Design

Tokens are CSS variables in `app/globals.css`. Warm neutrals, not cold SaaS grey:

```
--background: #faf9f5     --foreground: #17181a
--paper:      #ffffff     --muted:      #66675f
--surface:    #f1efe6     --muted-2:    #8a8b81
```

One saturated signal-green accent, deliberately vivid rather than a muted corporate tone:

```
--accent:        #0ea968
--accent-text:   #0a6b43
--accent-tint:   #e1f5eb   (citation chip background)
--accent-bright: #22d488
```

The hero is a dark band, not the light body — near-black with a green undertone, a radial bloom
(`.hero-dark-atmosphere`), and an SVG film-grain overlay (`.grain::after`) so it reads as a material
rather than a flat fill:

```
--hero-bg:     #0a0f0c
--hero-fg:     #f4f6f4
--hero-muted:  #a7b3ab
```

Type is system-first: `-apple-system, BlinkMacSystemFont` before anything else, falling back to
Onest (`app/layout.tsx`, loaded via `next/font/google`) on non-Apple platforms. Tokens are mapped
into Tailwind v4's theme via `@theme inline` in `app/globals.css`.

## Structure

```
app/
  page.tsx                      → hero, TeardownForm, HowItWorks
  layout.tsx                    → SiteHeader, Onest font, metadata, Vercel Analytics
  globals.css                   → design tokens, hero atmosphere, animations
  teardown/[slug]/page.tsx      → public report page, reads from teardownStore, revalidates every 5 min
  api/teardown/route.ts         → POST: slug → cache check → rate limit → collect → synthesize → save
components/
  TeardownForm.tsx              → hero URL input, posts to /api/teardown, redirects to the report
  HowItWorks.tsx                → static explainer of the four sources and the citation guarantee
  TeardownReport.tsx            → renders the seven sections
  Citation.tsx                  → the [id] chip — click to see the exact quote and source link
  SiteHeader.tsx                → sticky nav, transparent over the dark hero, opaque on scroll
lib/
  collectors/
    index.ts                    → runCollectors (Promise.allSettled), mergeEvidence
    types.ts                    → the Collector interface
    web.ts                      → site + pricing
    reviews.ts                  → G2, then Trustpilot
    ads.ts                      → Meta Ad Library
    press.ts                    → Google News RSS (no scrape — parsed directly)
    extract.ts                  → verbatim-quote extraction shared by web/reviews/ads
  evidence.ts                   → the Evidence type and validateCitations
  synthesize.ts                 → the seven-section prompt and the write_teardown tool call
  claude.ts                     → Anthropic SDK wrapper (askClaude, askClaudeStructured)
  firecrawl.ts                  → Orpheus-then-Firecrawl scraping, caching, retry
  orpheus.ts                    → self-hosted scraper, shell or HTTP transport
  throttle.ts                   → serialized queue for Firecrawl's rate cap
  window.ts                     → centers a scrape's content window on where the real text starts
  cache.ts                      → Redis-or-in-memory key/value store
  teardownStore.ts              → save/load a finished teardown, keeps a public index of slugs
  rateLimit.ts                  → 3 runs/day/IP
  slug.ts                       → URL → canonical company slug
  metrics.ts                    → best-effort run/collector counters
  getClientIp.ts                → x-forwarded-for extraction
```

Not shown: `app/api/agents/battlecard` and `app/api/agents/outbound`, plus a handful of
`components/` files (`AgentCard.tsx`, `PipelineForm.tsx`, `PipelineRunner.tsx`, `agents.tsx`) —
leftover routes and components from the previous four-agent-chain version of this product. Nothing
in the current app imports them, but they still build and ship. Dead code, not yet cleaned up.

## Testing

```bash
npm test
```

49 tests across 10 files in `lib/__tests__/`, covering the cache fallback, the full collector
pipeline, citation validation, evidence extraction, press RSS parsing, slug canonicalization,
synthesis, throttling, and the scrape-windowing logic.

---

Built by Fernando Peccatiello as a portfolio demo.
