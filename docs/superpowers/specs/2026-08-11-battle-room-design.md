# battle-room — Design Spec

Date: 2026-08-11
Status: Approved

## Purpose

Portfolio piece demonstrating an "AI agent orchestration" pattern lifted from a job posting requirement: agents that scrape competitor ads, rewrite brand battlecards, summarize media coverage, and draft personalized outbound sequences. Not built for a specific interview — built to showcase in Fer's portfolio ([fp-portfolio](../../../../fp-portfolio/README.md)) as a working demo of multi-agent orchestration.

## Non-goals

- Not a production competitive-intelligence tool. No auth, no saved history, no multi-tenant data.
- Not scraping authenticated/private data — only public pages (Meta Ad Library search, Google News search), same posture as [Competitor Gap Analyzer](../../../../Competitor%20Gap%20Analyzer/README.md).
- No invented facts or metrics about either brand. If a data source returns nothing, the agent says so — it does not fill the gap with plausible-sounding content generated from Claude's general knowledge.

## Architecture

Next.js (App Router) on Vercel — same pattern as Competitor Gap Analyzer. Firecrawl and Anthropic API keys live server-side only, in Vercel env vars, never shipped to the client.

```
battle-room/
├── app/
│   ├── page.tsx                          → form + pipeline UI (client component)
│   └── api/
│       └── agents/
│           ├── ads/route.ts              → Agent 1
│           ├── battlecard/route.ts       → Agent 2
│           ├── media/route.ts            → Agent 3
│           └── outbound/route.ts         → Agent 4
├── lib/
│   ├── firecrawl.ts                      → thin fetch wrapper around Firecrawl scrape endpoint
│   ├── claude.ts                         → thin wrapper around Anthropic SDK call
│   └── rateLimit.ts                      → per-IP daily counter (Upstash if configured, in-memory fallback)
├── components/
│   ├── PipelineForm.tsx                  → the 3-field input form
│   ├── AgentCard.tsx                     → one card: icon, name, status, expandable result
│   └── PipelineRunner.tsx                → owns sequential execution + card state
├── .env.local.example
└── README.md
```

## Input

One form, three required fields:

- **Your brand** (free text — name only, used as the "us" side of the battlecard and as sender context for outbound)
- **Competitor brand** (free text — the subject of the ads/media scrape)
- **Target persona** (free text — role/context for the outbound sequence, e.g. "Head of Ops at a mid-market SaaS company")

Submitting starts the pipeline. No other configuration.

## Pipeline execution

Client calls the four API routes **sequentially**, not in parallel — Agent 2 needs Agent 1's output, Agent 4 needs Agent 2's. Each `AgentCard` has state `idle → running → done | empty | error`. When a call resolves, its card expands to show the result and the next call fires. This gives the "agents working one after another" visual without needing SSE/streaming infrastructure.

### Agent 1 — Ad Intelligence
- Firecrawl scrapes the public Meta Ad Library search results page for the competitor brand name (no login required for basic keyword search).
- Claude receives the scraped ad text/markdown and extracts 3–5 bullet insights: recurring hooks, angles, offers, positioning claims.
- If Firecrawl returns no usable ad content, the card shows an explicit "No active ads found in the Meta Ad Library for this brand" state. Pipeline continues — Agent 2 is told no ad data was available and must not invent any.

### Agent 2 — Battlecard Writer
- Input: Agent 1's output (or "no data" flag) + your brand name + competitor brand name.
- Claude drafts a battlecard: positioning summary, likely differentiators to lead with, common objections and how to handle them.
- Prompt explicitly forbids inventing specific metrics, pricing, or claims about either company not present in the scraped input — output is framed as strategic structure/angles, not fabricated facts.

### Agent 3 — Media Coverage
- Firecrawl scrapes a Google News search results page for the competitor brand name.
- Claude summarizes recent coverage themes and general sentiment (positive/neutral/negative framing, not a numeric score).
- Same "no data found" fallback as Agent 1 if the search returns nothing usable.

### Agent 4 — Outbound Sequence
- Input: Agent 2's battlecard + target persona.
- Claude drafts a 3-email outbound sequence personalized to the persona's role/context, referencing the positioning angles from the battlecard.
- No invented facts about a specific real recipient — personalization is by role/context only, per [[fer-avoids-invented-metrics]].

## Error handling

- Firecrawl failure (network/timeout/blocked): card shows "couldn't reach [source]" state, pipeline continues with the "no data" flag passed downstream.
- Claude API failure: card shows a retry button for that single agent; does not restart the whole pipeline.
- Rate limit exceeded: form submit is blocked before any agent runs, with a clear "3 runs/day limit reached, try again tomorrow" message.

## Rate limiting

3 completed pipeline runs per IP per day. Same in-memory-with-Upstash-fallback pattern already used in Competitor Gap Analyzer's `lib/rateLimit.ts` — reuse the approach, not a new mechanism.

## Visual design

Apple-inspired but **deliberately distinct from fp-portfolio's Pacific Blue** so the two don't read as the same reskinned template when shown side by side in the portfolio.

- **Type** — `-apple-system` / SF on Apple platforms, Onest elsewhere (same as fp-portfolio, this part is a house standard).
- **Colour** — neutral greys (`#ffffff` / `#f5f5f7` / `#1d1d1f` / `#6e6e73`), same neutral base as fp-portfolio for family resemblance, but the accent is **Alpine Green** (`#1E3A2F`, accent text `#16291F`) — pulled from Apple's own hardware finish palette (the deep green used on iPhone 13 Pro / MacBook Pro), same sourcing logic as fp-portfolio's Pacific Blue but a different finish. Reads elegant, serious, distinct — fits a competitive-intelligence tool better than blue.
- **Radii** — 8/14/20/28px + pill, matching fp-portfolio's system.
- Agent cards use fill-weight (not hue) to differentiate status, same principle as fp-portfolio's status chips: idle = outlined, running = subtle accent fill + pulse, done = solid accent fill.
- All text/background pairs at or above WCAG AA (4.5:1).

## Deploy

New GitHub repo `battle-room` → Vercel, same flow as other projects in this workspace. `.env.local.example` documents `ANTHROPIC_API_KEY`, `FIRECRAWL_API_KEY`, and optional Upstash vars.

## Testing approach

Manual verification in browser (dev server) covering:
- Happy path: all 4 agents return real data for a well-known brand with active Meta ads and recent press.
- Empty-data path: a small/obscure brand with no ads or no news coverage, confirming the "no data found" states render and downstream agents don't fabricate.
- Rate limit: 4th run in a day is blocked with the correct message.
- Mobile viewport (375px) — this is a demo tool, not a CRO landing page, so the landing-page non-negotiables checklist (countdown timers, hero forms, etc.) does not apply, but basic mobile usability of the form and cards still does.
