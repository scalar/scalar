import { z } from 'zod'

import type { ReleaseNotesProvider } from '../config/types'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4.1-mini'

type OpenAIProviderOptions = {
  apiKey?: string
  model?: string
  fetchImpl?: typeof fetch
}

const responseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({ content: z.string().nullable().optional() }).optional(),
      }),
    )
    .optional(),
  error: z.object({ message: z.string().optional() }).optional(),
})

type OpenAIResponse = z.infer<typeof responseSchema>

const extractText = (response: OpenAIResponse): string => {
  const text = response.choices?.[0]?.message?.content?.trim() ?? ''
  if (!text) {
    throw new Error('OpenAI response did not include any message content')
  }
  return text
}

export const createOpenAIProvider = (options: OpenAIProviderOptions = {}): ReleaseNotesProvider => {
  return {
    name: 'openai',
    defaultModel: options.model ?? DEFAULT_MODEL,
    generateJson: async ({ model, systemPrompt, userPrompt, maxOutputTokens, signal }) => {
      const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY is not set. Pass an API key or configure another provider.')
      }

      const fetchImpl = options.fetchImpl ?? fetch
      const response = await fetchImpl(OPENAI_API_URL, {
        method: 'POST',
        signal,
        headers: {
          authorization: `Bearer ${apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: model ?? options.model ?? DEFAULT_MODEL,
          max_tokens: maxOutputTokens,
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        }),
      })

      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`OpenAI API call failed (${response.status}): ${detail}`)
      }

      const body: unknown = await response.json()
      const parsed = responseSchema.safeParse(body)
      if (!parsed.success) {
        throw new Error('OpenAI API returned a malformed response', { cause: parsed.error })
      }
      const payload = parsed.data
      if (payload.error?.message) {
        throw new Error(`OpenAI API returned an error: ${payload.error.message}`)
      }

      return extractText(payload)
    },
  }
}
