# Growth Agent Orchestrator

A portfolio demo of AI agent orchestration: four agents run in sequence to turn a competitor's name into a live ad-intelligence brief, a battlecard, a media coverage summary, and a personalized outbound email sequence.

(Repo is named `v2-claude` — `growth-agent-orchestrator` was already taken by another project on this account. The app itself is titled Growth Agent Orchestrator throughout.)

Built after reading a job posting that asked for exactly this pattern — scrape competitor ads, rewrite battlecards, summarize media coverage, draft outbound sequences. This isn't built for that specific application; it's built to show the pattern works, as a personal portfolio piece.

## How it works

1. **Ad Intelligence** (`app/api/agents/ads/route.ts`) — Firecrawl scrapes the public Meta Ad Library search results for the competitor brand; Claude extracts 3–5 real ad angles, or reports none were found. This route also enforces the pipeline's only rate limit (3 runs/day/IP).
2. **Battlecard Writer** (`app/api/agents/battlecard/route.ts`) — Claude drafts positioning, differentiators, and objection handling from your brand name + the competitor's ad angles (or a plain "no ad data" note if none were found). Never invents metrics or facts not given to it.
3. **Media Coverage** (`app/api/agents/media/route.ts`) — Firecrawl scrapes a Google News search for the competitor; Claude summarizes recent coverage themes and sentiment.
4. **Outbound Sequence** (`app/api/agents/outbound/route.ts`) — Claude writes a 3-email sequence personalized to your target persona's role, referencing the battlecard's positioning. Personalizes by role only, never invents a real recipient's name.

Each agent's result renders in its own card as the pipeline runs (`components/AgentCard.tsx`) — no data is ever backfilled with invented content; if a scrape comes back empty, the card says so.

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
- `FIRECRAWL_API_KEY` — required, every scrape goes through Firecrawl, no plain-fetch fallback.
- `ANTHROPIC_MODEL` — optional, falls back to a default model when unset.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — optional. Without these, caching and rate limiting fall back to an in-memory store (works locally, but resets on redeploy and isn't shared across serverless instances).

## Known limitations

Documented honestly, not fixed — these are accepted trade-offs for a portfolio demo, not a shipped product.

1. **Rate limiting is only enforced at the entry point.** The 3-runs/day/IP limit is checked once, in `app/api/agents/ads/route.ts` (the pipeline's first step). Calling `api/agents/battlecard`, `api/agents/media`, or `api/agents/outbound` directly — without going through `api/agents/ads` first — bypasses this check entirely. Acceptable for a portfolio demo's threat model; a real product would need per-route limiting.
2. **Prompt-injection chain across agents.** `competitorBrand` and scraped ad content flow: attacker-controllable Meta Ad Library page → Firecrawl → Agent 1's Claude call → Agent 1's output → Agent 2's Claude call → Agent 2's output (battlecard) → Agent 4's Claude call. None of the four routes sanitize or delimit upstream text before interpolating it into the next agent's prompt — each route relies entirely on its own system prompt's hard rules (e.g. "never invent a fact not given to you") as its only defense. A crafted ad page containing injected instructions has multiple chances to survive into the final outbound emails.
3. **"Never invent a recipient's name" is a fabrication guard, not a PII/privacy filter.** The outbound agent's system prompt stops Claude from making up a fake name — it does nothing to redact real PII if the visitor's own `persona` input happens to contain some (e.g. a real name or email pasted in). Don't read this as a privacy safeguard; it's anti-fabrication only.
4. **In-memory rate limiting resets on redeploy** and isn't shared across serverless instances, unless Upstash Redis env vars are configured (optional, see above).

## Design

Apple-inspired: neutral greys (`#ffffff` / `#f5f5f7` / `#1d1d1f` / `#6e6e73`) with an Alpine Green accent (`#1e3a2f`, accent text `#16291f`) — pulled from Apple's own hardware finish palette. Deliberately distinct from the Pacific Blue accent used in a sibling portfolio-site project (`fp-portfolio`) so the two don't read as the same reskinned template side by side.

Typeface is SF on Apple platforms (`-apple-system`), Onest elsewhere (`app/layout.tsx`, loaded via `next/font/google`). Tokens are defined as CSS variables in `app/globals.css` and mapped into Tailwind v4 theme colors (`@theme inline`).

## Structure

```
app/
  page.tsx                          → hero, "how it works" explainer, and PipelineRunner
  layout.tsx                        → sticky header, fonts, metadata, Vercel Analytics
  globals.css                       → design tokens (colors, shadows, font stack)
  api/agents/ads/route.ts           → Ad Intelligence agent + the pipeline's rate limit check
  api/agents/battlecard/route.ts    → Battlecard Writer agent
  api/agents/media/route.ts         → Media Coverage agent
  api/agents/outbound/route.ts      → Outbound Sequence agent
components/
  agents.tsx                        → shared agent metadata (title/description/icon) — single
                                       source of truth for both the static explainer and the
                                       live pipeline cards, so they can't drift apart
  HowItWorks.tsx                    → static, always-visible explainer of what each agent does
                                       and how to use the tool (shown before the form)
  PipelineForm.tsx                  → brand/persona input form
  PipelineRunner.tsx                → orchestrates the 4 agent calls in sequence, holds run state
  AgentCard.tsx                     → per-agent result card (5 visual states: idle, running, done, empty, error)
lib/
  claude.ts                         → Anthropic SDK wrapper (askClaude)
  firecrawl.ts                      → Firecrawl scraping helpers (Ad Library, Google News)
  rateLimit.ts                      → 3 runs/day/IP check, Upstash-backed with in-memory fallback
  cache.ts                          → scrape/response caching, Upstash-backed with in-memory fallback
  getClientIp.ts                    → client IP extraction for rate limiting
```

---

Built by Fernando Peccatiello as a portfolio demo.
