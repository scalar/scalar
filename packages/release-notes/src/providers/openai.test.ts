import { describe, expect, it } from 'vitest'

import { createOpenAIProvider } from './openai'

describe('openai', () => {
  it('returns message content from the OpenAI response', async () => {
    const provider = createOpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"version":"1.0.0","title":"Shipped"}',
                },
              },
            ],
          }),
          { status: 200 },
        ),
    })

    const result = await provider.generateJson({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema: {},
      maxOutputTokens: 1024,
    })

    expect(result).toBe('{"version":"1.0.0","title":"Shipped"}')
  })

  it('throws when the API returns an error response', async () => {
    const provider = createOpenAIProvider({
      apiKey: 'test-key',
      fetchImpl: async () => new Response('bad request', { status: 400 }),
    })

    await expect(
      provider.generateJson({
        systemPrompt: 'system',
        userPrompt: 'user',
        schema: {},
        maxOutputTokens: 1024,
      }),
    ).rejects.toThrow('OpenAI API call failed (400): bad request')
  })
})
