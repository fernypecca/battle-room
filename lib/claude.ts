import Anthropic from '@anthropic-ai/sdk'

const DEFAULT_MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 2048

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
