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
  const rawYourBrand = body?.yourBrand
  const rawCompetitorBrand = body?.competitorBrand
  const yourBrand = typeof rawYourBrand === 'string' ? rawYourBrand.trim() : ''
  const competitorBrand = typeof rawCompetitorBrand === 'string' ? rawCompetitorBrand.trim() : ''
  const adInsights = typeof body?.adInsights === 'string' ? body.adInsights.trim() : null

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
