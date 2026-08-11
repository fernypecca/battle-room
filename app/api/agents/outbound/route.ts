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
  const rawBattlecard = body?.battlecard
  const rawPersona = body?.persona
  const battlecard = typeof rawBattlecard === 'string' ? rawBattlecard.trim() : ''
  const persona = typeof rawPersona === 'string' ? rawPersona.trim() : ''

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
