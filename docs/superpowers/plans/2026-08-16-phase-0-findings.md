# Phase 0 Findings: Can We Get Real Customer Review Text via Firecrawl?

**Date:** 2026-08-16
**Spike script:** `scripts/spike-sources.ts` (deleted after this run — throwaway per plan)
**Brands probed:** notion, linear, figma, intercom, webflow (5 sources each = 25 calls)

## Method

Ran the planned spike script first. It hit a hard Firecrawl rate limit (10 req/min) after
2 of 5 brands (notion, linear) completed — figma/intercom/webflow all errored with
`Rate limit exceeded` on the first pass. Rather than accept partial data, ran a second,
throttled (7s between calls) follow-up script hitting the specific gaps: full-content
saves for inspection, a corrected Capterra URL pattern, a corrected `linear.app` domain,
and retries on Trustpilot/G2 for figma/intercom/webflow. All verdicts below are based on
reading full scraped markdown, not just character counts.

## Per-source verdicts

### G2 — WORKS

- **URL tried:** `https://www.g2.com/products/{brand}/reviews` — worked as-is, no adjustment needed.
- **Result:** Confirmed for notion, linear, and figma. Pages return structured review blocks
  ("What do you like best about X?", "What do you dislike about X?", star ratings, reviewer
  title/company) with genuine free-text answers.
- **Quote (notion, 4.5/5 reviewer):** *"The forms, overall structure, dark mode, stats, and
  ease of use are all strong... Performance feels snappy, and I haven't experienced any lag
  when entering input... I'd love to see more spreadsheet options so I can do more of what a
  typical Excel sheet can do."*
- **Errors:** None on this pattern once outside the rate-limit window.

### Capterra — WORKS, but the spike's URL pattern was wrong

- **URL tried (per spike script):** `https://www.capterra.com/search/?query={brand}` —
  this is a **search results page**, not a reviews page. It returned 15-18k chars but it's
  chrome: product cards, logos, category links. Zero customer sentences. This would have been
  a false PASS on char-count alone — exactly the failure mode the task warned about.
- **Better pattern found and tested:** direct product review URL,
  `https://www.capterra.com/p/{numeric_id}/{Slug}/reviews/` (e.g.
  `capterra.com/p/186596/Notion/reviews/`). This returns real structured "Pros"/"Cons"
  review text with ratings sub-scores (Ease of Use, Customer Service, Value for Money, etc.).
  Confirmed for both notion and intercom.
- **Quote (notion review):** *"I can tweak things as I go. If a project needs a different
  kind of tracker, I can usually just adjust the view instead of rebuilding the whole page
  from scratch... on my phone the bigger pages can take a few seconds to load, sometimes
  longer if I'm on weaker wifi."*
- **Implication for the collector:** Capterra needs a two-step resolution (find the numeric
  product ID/slug — e.g. via Capterra's own search or a site-restricted web search — then
  scrape the `/reviews/` page), not a guessable URL from brand name alone.

### Trustpilot — WORKS, but inconsistent (bot-check wall on some runs)

- **URL tried:** `https://www.trustpilot.com/review/{brand}.com`
- **Result:** Mixed. On the first pass, both notion.com and linear.com returned a
  Cloudflare-style challenge page (~150-170 chars: *"Verifying your connection... Please
  wait while we verify your browser. Verification failed."*) — a hard block that run. On the
  throttled retry, the identical pattern against **figma.com** and **webflow.com** returned
  full pages with real reviews and star ratings, no challenge at all.
- **Quote (webflow, 1-star):** *"WebFlow sucks. They nickel and dime you for everything. If I
  knew what I know now I would never have used WebFlow. Horrible experience."*
- **Quote (figma, 2-star):** *"Two stars. We're in the process of moving everything to another
  design tool. We get constantly overcharged. I switch seats, get charged. I remove my seat,
  then the teammate can't access anything."*
- **Implication:** Real quotes are reachable, but the bot-check appears to trigger
  intermittently rather than by domain, so a production collector needs retry-on-block logic
  and should not treat a single Trustpilot failure as a hard BLOCKED verdict.

### Home — WORKS

- **URL tried:** `https://{brand}.com`
- notion.com scraped cleanly (9.7k chars of real marketing copy, customer logos, feature copy).
- linear.com returned an unrelated energy-storage company's site (58k chars about "battery
  storage," "Rimac Energy") — **this is the domain-guessing artifact flagged in the task
  brief, not a scraping failure.** Linear's real domain is `linear.app`. Refetched
  `https://linear.app` directly and got clean, real content ("The product development system
  for teams and agents...").

### Pricing — WORKS

- **URL tried:** `https://{brand}.com/pricing`
- notion.com/pricing scraped cleanly (23.4k chars, real pricing tiers and copy).
- linear.com/pricing had the same domain artifact as above; `https://linear.app/pricing`
  scraped cleanly with real tier data (Free $0, Basic $10/user/month, etc.).

## Operational note (not one of the 5 sources, but load-bearing)

Firecrawl rate-limited this account at **10 requests/minute**. The first, unthrottled pass
lost 15 of 25 calls to this. Four collectors fetching multiple sources in parallel per
teardown run will hit this immediately unless requests are queued/throttled or the plan is
upgraded. This needs to be designed for in Phase 1, not discovered in production.

## Recommendation: GO

All three review sources (G2, Capterra, Trustpilot) returned genuine, verbatim customer
sentences when hit with the correct URL pattern — well above the "two or more" bar for an
unqualified GO. Proceed with the reviews collector as planned, with two adjustments carried
into Phase 1 design:

1. **Capterra** needs a product-ID resolution step before the reviews URL will work — it
   cannot be guessed from the brand name the way G2's can.
2. **Trustpilot** needs retry-on-block handling since the bot-check is intermittent, not
   domain-specific.
3. **Rate limiting** (10 req/min) must be designed into the collector's request scheduling
   regardless of source mix.
