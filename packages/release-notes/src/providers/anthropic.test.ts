import { describe, expect, it } from 'vitest'

import { createAnthropicProvider } from './anthropic'

describe('anthropic', () => {
  it('returns text content from the Anthropic response', async () => {
    const provider = createAnthropicProvider({
      apiKey: 'test-key',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            content: [{ type: 'text', text: '{"version":"1.0.0","title":"Shipped"}' }],
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
    const provider = createAnthropicProvider({
      apiKey: 'test-key',
      fetchImpl: async () => new Response('rate limited', { status: 429 }),
    })

    await expect(
      provider.generateJson({
        systemPrompt: 'system',
        userPrompt: 'user',
        schema: {},
        maxOutputTokens: 1024,
      }),
    ).rejects.toThrow('Anthropic API call failed (429): rate limited')
  })
})
