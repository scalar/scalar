import { z } from 'zod'

import type { ReleaseNotesProvider } from '../config/types'

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_API_VERSION = '2023-06-01'
const DEFAULT_MODEL = 'claude-sonnet-4-5'

type AnthropicProviderOptions = {
  apiKey?: string
  model?: string
  fetchImpl?: typeof fetch
}

const responseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })).optional(),
  error: z.object({ message: z.string().optional() }).optional(),
})

type AnthropicResponse = z.infer<typeof responseSchema>

const extractText = (response: AnthropicResponse): string => {
  const block = response.content?.find((entry) => entry.type === 'text' && typeof entry.text === 'string')
  const text = block?.text?.trim() ?? ''
  if (!text) {
    throw new Error('Anthropic response did not include any text content')
  }
  return text
}

export const createAnthropicProvider = (options: AnthropicProviderOptions = {}): ReleaseNotesProvider => {
  return {
    name: 'anthropic',
    defaultModel: options.model ?? DEFAULT_MODEL,
    generateJson: async ({ model, systemPrompt, userPrompt, maxOutputTokens, signal }) => {
      const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not set. Pass an API key or configure another provider.')
      }

      const fetchImpl = options.fetchImpl ?? fetch
      const response = await fetchImpl(ANTHROPIC_API_URL, {
        method: 'POST',
        signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: model ?? options.model ?? DEFAULT_MODEL,
          max_tokens: maxOutputTokens,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`Anthropic API call failed (${response.status}): ${detail}`)
      }

      const body: unknown = await response.json()
      const parsed = responseSchema.safeParse(body)
      if (!parsed.success) {
        throw new Error('Anthropic API returned a malformed response', { cause: parsed.error })
      }
      const payload = parsed.data
      if (payload.error?.message) {
        throw new Error(`Anthropic API returned an error: ${payload.error.message}`)
      }

      return extractText(payload)
    },
  }
}
