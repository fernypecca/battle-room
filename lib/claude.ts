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
