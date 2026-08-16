# Competitor Teardown — Design Spec

Date: 2026-08-16
Status: Approved
Supersedes: [2026-08-11-battle-room-design.md](2026-08-11-battle-room-design.md)

## Purpose

Turn the Growth Agent Orchestrator portfolio demo into a tool a real startup can use, and launch it on Product Hunt.

Paste a competitor's URL, get a teardown where **every claim links to the source it came from**. Optionally paste your own URL to get a private comparative layer (battlecard, angles, outbound sequence).

## Why the current version doesn't deliver value

Diagnosed from the existing code, in severity order:

1. **P0 — It doesn't know what you sell.** Input is three strings (your brand, competitor, persona). Claude has no information about either product. The system prompts correctly forbid inventing facts, so all that's left is empty structure ("lead with category ownership"). When it *does* fabricate, it's the model filling the vacuum from pre-training — uncited and unverifiable. The guardrail isn't broken; it's protecting an empty input.
2. **P0 — Step 1 fails often and drags the rest down.** The Meta Ad Library is JS-heavy and bot-protected. `NO_ADS_FOUND` → battlecard falls back to "general positioning structure only" → generic emails. That degraded path is likely the normal path.
3. **P1 — Agent order wastes the best signal.** Media Coverage runs *after* the battlecard, so funding, launches, and PR crises never inform positioning.
4. **P1 — No output.** No copy, export, save, or share. Run it, read it, lose it.
5. **P2 — Nothing is verifiable.** One call per agent, no sources, no links. For competitive intelligence, "where did this come from" *is* the value proposition.

## Goals

- Every claim in a teardown is anchored to a fetched, clickable source.
- A teardown is a shareable artifact with a stable public URL.
- The tool stays useful when any single source returns nothing.
- Author attribution travels with every shared teardown.
- Adoption is measurable from durable, self-held counters.

## Non-goals

- No auth, no accounts, no user history, no dashboard.
- No payments or plan tiers.
- No scraping of authenticated or private data — public pages only.
- The rate limit is **not** being changed in this work (see Known limitations, carried forward).

## Prior art — sibling tool

A second version of this idea exists at `growth-agent-orchestrator.vercel.app` (built separately, with a different assistant). It runs five agents, takes much richer manual input (USPs, pain points, target role, company size, channels), adds an LLM self-review pass, and already ships markdown copy/download plus a counts dashboard.

Worth borrowing:

- **RSS instead of scraping for press.** Google News publishes RSS. That is more reliable and cheaper than putting Firecrawl on a search results page, and it removes one fragile scrape from the pipeline. Adopt for the `press` collector.
- **Structured JSON outputs from the model.** Already proven working there, which de-risks the evidence contract.
- **Markdown copy + `.md` download.** Reuse the interaction pattern rather than reinventing it.

Deliberately *not* borrowed:

- **Manual input of USPs and pain points.** It fixes the "doesn't know what you sell" problem by making the user type everything, which is real friction on cold traffic from Product Hunt. This design derives the same information from scraping the user's own URL. A manual override can be added later if scraping proves insufficient — it is not needed for launch.
- **LLM self-review pass.** For citation integrity a code-level validator is strictly better: deterministic, free, and it cannot itself hallucinate. See the validator requirement below.

### Citation validator

After synthesis and before rendering or caching, a pure function checks that every `[id]` referenced in the output exists in the collected evidence set. Unknown ids are stripped and logged rather than rendered as dead links. This runs in code, not in the model, so the core promise of the product does not depend on the model policing itself.

## Architecture

The core change: **separate collecting from reasoning.**

Today it's a chain — `ads → battlecard → media → outbound` — where each agent rewrites the previous one's prose. That propagates errors, runs serially, and is exactly the cross-agent prompt-injection chain documented as limitation #2 in the README.

```
                    ┌─ web + pricing ─┐
   competitor URL ──┼─ reviews ───────┼──→ synthesizer ──→ public teardown
                    ├─ ads ───────────┤      (1 call)      /teardown/[slug]
                    └─ press ─────────┘
                    4 in parallel, ~30s          │
                                                 ↓
                    your URL ─────────→ comparative layer (private, email-gated)
```

The four collectors never talk to each other. Each extracts cited evidence from **its own** source and does not opine. A single synthesizer sees everything at once and writes.

This buys three things at once: parallel latency instead of serial, a failed scrape that no longer poisons downstream agents, and injection contained to one hop with untrusted evidence explicitly delimited and labeled.

### Evidence contract

This is what structurally prevents fabrication.

Collectors return typed items, never prose:

```ts
interface Evidence {
  id: string            // 'rev-3', 'web-1'
  source: 'web' | 'reviews' | 'ads' | 'press'
  url: string           // the exact page it came from
  quote: string         // verbatim excerpt, not a paraphrase
  fetched_at: string    // ISO timestamp
}
```

The synthesizer has one hard rule: **every claim carries an `[id]`, and a point with no evidence is not written** — the section says "no data" instead. The UI renders each `[id]` as a link to its source.

The difference from today is fundamental. Today the model is *asked* not to invent and trusted to comply. Here it cannot assert anything without hanging it on a citation the reader can open. The guardrail stops being a promise in a prompt and becomes a property of the structure.

The synthesizer prompt must also state that evidence content is untrusted data, never instructions — it is attacker-controllable (a competitor's own web page or ad copy).

### Collectors

| Collector | Target | Reliability | Notes |
|---|---|---|---|
| `web` | Home + pricing + features | High | The base. Always exists. Gives every other source its context. |
| `reviews` | G2 / Capterra / Trustpilot | **Unvalidated** | Highest value, must be de-risked first (see Risks). |
| `ads` | Meta Ad Library | Low | Current fragile path. Keep, but never depend on it. |
| `press` | Google News | Medium | Already built and working. |

Each returns `Evidence[]` or `null`. `null` means "no data found" and is rendered as such — never backfilled.

Orchestration uses `Promise.allSettled`: one rejected collector must not fail the run.

## The public teardown

**Route:** `/teardown/[slug]`, slug canonicalized from the domain (`notion.so` → `notion`).

**Caching:** by slug, 7-day TTL, on the existing Upstash-backed `lib/cache.ts`. The first visitor asking about Notion pays for four scrapes; everyone after loads instantly at zero cost. The cache stops being an optimization and becomes the cost model.

**Index:** `/teardowns` lists every teardown generated. This directory is the compounding asset — it grows with each use and is the only part Google can index.

**Sections, in order:**

| # | Section | Source |
|---|---|---|
| 1 | What they sell and to whom | web |
| 2 | How they position themselves (their words, quoted) | web |
| 3 | Actual pricing | pricing |
| 4 | **What their customers say — good and bad** | reviews |
| 5 | What they're advertising right now | ads |
| 6 | What happened to them recently | press |
| 7 | Where they're vulnerable | synthesis, anchored |

Section 4 is the differentiator. Verbatim complaints from a competitor's customers are the most actionable material that exists for positioning, and nobody else is serving it well. If one section has to be flawless, it's that one.

**Sharing:** dynamic OG image via Next's `ImageResponse` — competitor name, two hard data points from the report, and the author byline. A teardown link pasted on LinkedIn must look like a report, not a generic link.

**Export:** copy button and markdown export per section. This closes the "no output" gap.

## The comparative layer

**Route:** `/teardown/[slug]/vs/[your-domain]`, `noindex`, behind the email capture.

Reuses the existing battlecard and outbound prompts nearly as-is, but now fed real evidence about *both* companies instead of two bare brand names. This is where the original P0 gets fixed: the model finally knows what you sell.

Email capture is a simple record stored in Upstash, not an account. It doubles as an adoption metric.

**The gate is a UI gate, not a security boundary.** The comparative route is `noindex` and unlisted, but anyone who knows or guesses the URL can load it, and the generation endpoint can be called directly — the same posture as the current rate limit. This is accepted deliberately: the comparative layer contains only the visitor's own public URL and Claude's analysis of it, so a leaked URL exposes nothing the visitor didn't already publish. Do not later treat this route as private storage.

## Attribution

Author attribution is a feature here, not a footer line. Every shared teardown is a vehicle for the author's name.

- Visible byline on the teardown page itself
- Author name rendered into the OG image
- `<meta name="author">` and `schema.org/Person` structured data marking authorship of the analysis
- Public repo prominently linked; the README argues the contribution rather than merely documenting it

## Visual design

The teardown page is the artifact that gets shared, so its design is a product requirement, not a finishing pass. It has to read as an expensive research report — the kind of page someone screenshots — not as a chat transcript with links.

Existing tokens carry forward unchanged, as they actually exist in `app/globals.css` — warm neutrals (`--background: #faf9f5`, `--paper: #ffffff`, `--surface: #f1efe6`, `--foreground: #17181a`), a saturated signal green (`--accent: #0ea968`, `--accent-text: #0a6b43`), and the dark hero band (`--hero-bg: #0a0f0c`) with its radial bloom and film grain. SF on Apple platforms with Onest elsewhere, tokens as CSS variables mapped into Tailwind v4 `@theme inline`.

Note: the README currently documents a different, older palette (Alpine Green `#1e3a2f` over cold greys). The README is stale, `globals.css` is correct, and the README should be corrected as part of this work.

New surfaces and their requirements:

- **Teardown page** — document typography, not app typography. Constrained measure (~68ch) for body text, real hierarchy between section headings and claims, generous vertical rhythm between the seven sections. Left-aligned asymmetric composition; no centered hero. A sticky section nav that tracks scroll position, since the report is long and people arrive wanting one section.
- **The citation chip** — the signature interaction of the whole product, and the thing that must feel most crafted. An `[id]` is a quiet inline affordance, not a loud badge: subtle, non-competing with body text at rest, revealing the verbatim quote, source domain, and fetch date on hover or tap. It must work on touch. This single element carries the entire "with the receipts" promise, so it gets disproportionate design attention.
- **Section 4 (customer quotes)** — deserves its own treatment. Verbatim complaints set as pull quotes, visually distinct from synthesized prose, so the reader can tell at a glance what is evidence and what is analysis.
- **"No data" states** — must look deliberate and confident, not broken. An empty ads section is an honest finding, and should read that way.
- **Library index** — restrained, scannable, gets denser as it grows. It will eventually hold hundreds of entries.
- **OG image** — composed, not templated. Competitor name, two hard data points, author byline. It is the first impression for everyone arriving from a shared link.

Motion stays subtle and physical (ease-out, 200–300ms) on scroll reveals and the citation chip. Nothing bouncy, nothing that competes with reading.

## Metrics

Vercel Analytics gives a number but no defensible history. Persist own counters in Upstash from day one — this data needs months of accumulation to be worth anything, so it cannot be bolted on at the end:

- total runs, unique teardowns generated
- distinct visitor countries
- distinct domains analyzed
- email captures
- per-collector success/failure rate (also the health signal for the fragile sources)

## Error handling

Carried forward from the current design, which already handles this well:

- A collector returning nothing renders an explicit "no data" state — never invented filler.
- `AgentCard`'s five visual states (idle, running, done, empty, error) are reused as-is.
- A missing API key still fails loudly rather than caching a false negative.
- A failed scrape is not cached; a genuinely empty successful scrape is.

## What gets reused

`lib/claude.ts`, `lib/cache.ts`, `lib/firecrawl.ts`, `lib/getClientIp.ts`, and `components/AgentCard.tsx` survive nearly unchanged. The four agent routes are rewritten as collectors. `PipelineRunner` changes from sequential to `Promise.allSettled`. The design tokens and type stack stay as they are.

## Known limitations carried forward

1. **Rate limiting is non-atomic and entry-point only.** Explicitly out of scope for this work. Slug-level caching substantially reduces real cost exposure, but on launch day this remains the only defense.
2. **Persona/free-text input is not a PII filter.** Anti-fabrication only, as before.

## Risks

**The thesis rests on section 4.** If G2/Capterra/Trustpilot cannot be scraped reliably, the product degrades back to generic and the launch angle collapses. This must be validated **before** anything else is built — it is cheap to test and decisive.

**Product Hunt is saturated with AI wrappers.** The only defensible differentiator is that every line is verifiable in one click, and it has to read in the first five seconds. Tagline: *"Competitor teardowns, with the receipts."* — chosen because it attacks the audience's actual objection (another tool that hallucinates) head-on.

**A single launch is thin evidence.** What accumulates is the engine: the indexable library, press coverage, repo stars. Design for twelve months of output, not one day.

## Phases

Target: launch within ~6-8 weeks, leaving runway for press and metrics to mature.

- **Phase 0 — Validate.** Spike G2/Capterra/Trustpilot and web/pricing scraping. Decisive go/no-go on section 4. Nothing else gets built first.
- **Phase 1 — Rebuild.** Collectors + synthesizer, evidence contract, public teardown page. Metrics persisted from day one.
- **Phase 2 — Artifact.** Library index, OG images, attribution, export, comparative layer + email capture. Seed 40 teardowns of brands whose growth teams are likely to notice and share.
- **Phase 3 — Launch.** Product Hunt, plus outreach to niche newsletters and trade press using a real teardown as the hook.

## Open items

- Meta Ad Library access route (scrape vs. official API vs. third-party provider) is unresolved. Current scrape stays as the fallback; a better route should be investigated during Phase 1, not blocking.
- Immigration-evidence strategy should be validated with an immigration attorney. This spec produces artifacts; it does not assess what qualifies.
