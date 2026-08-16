import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = 'claude-sonnet-5'

// The synthesizer writes seven cited sections in one call. At 2048 this
// silently truncated its JSON mid-string once the collectors started
// surfacing real review and ad evidence, which surfaced as an opaque
// "could not be parsed as JSON" failure rather than as "ran out of room".
const MAX_TOKENS = 8192

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

  // Hitting the cap mangles structured output, and downstream that shows up
  // as a confusing JSON parse error far from the real cause. Name it here.
  if (response.stop_reason === 'max_tokens') {
    throw new Error(
      `Claude response hit the ${MAX_TOKENS}-token cap and was truncated. Raise MAX_TOKENS or send less input.`
    )
  }

  return textBlock.text.trim()
}

/**
 * Pulls a JSON value out of a model response. Models wrap JSON in fences or
 * add a sentence of preamble often enough that tolerant extraction is worth
 * more than a strict JSON.parse that fails the whole collector.
 */
export function extractJson<T = unknown>(raw: string): T {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidates = [fenced?.[1], raw].filter((c): c is string => typeof c === 'string')

  for (const candidate of candidates) {
    const trimmed = candidate.trim()
    const start = trimmed.search(/[[{]/)
    if (start === -1) continue
    const end = Math.max(trimmed.lastIndexOf(']'), trimmed.lastIndexOf('}'))
    if (end <= start) continue
    try {
      return JSON.parse(trimmed.slice(start, end + 1)) as T
    } catch {
      continue
    }
  }

  throw new Error(`Model output could not be parsed as JSON: ${raw.slice(0, 200)}`)
}

export async function askClaudeJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const raw = await askClaude(systemPrompt, userPrompt)
  return extractJson<T>(raw)
}
