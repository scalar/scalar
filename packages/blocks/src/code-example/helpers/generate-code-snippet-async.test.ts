import { getLoadedPlugin } from '@scalar/snippetz/lazy'
import { describe, expect, it } from 'vitest'

import { generateCodeSnippet, generateCodeSnippetAsync } from './generate-code-snippet'

const props = {
  customCodeSamples: [],
  operation: { summary: 'List planets' },
  method: 'get',
  path: '/planets',
  contentType: undefined,
  example: undefined,
  server: { url: 'https://example.com' },
  securitySchemes: [],
} satisfies Omit<Parameters<typeof generateCodeSnippet>[0], 'clientId'>

// A file of its own, so no other test has preloaded the generators yet
describe('generateCodeSnippetAsync', () => {
  it('loads the generator and returns the snippet the synchronous version only returns after a preload', async () => {
    expect(getLoadedPlugin('shell', 'httpie')).toBeUndefined()
    expect(generateCodeSnippet({ ...props, clientId: 'shell/httpie' })).toBe('Code snippet generator is not loaded')

    const snippet = await generateCodeSnippetAsync({ ...props, clientId: 'shell/httpie' })

    expect(snippet).toContain('https://example.com/planets')
    expect(snippet).not.toBe('Code snippet generator is not loaded')
    expect(generateCodeSnippet({ ...props, clientId: 'shell/httpie' })).toBe(snippet)
  })

  it('returns custom code samples without loading anything', async () => {
    const snippet = await generateCodeSnippetAsync({
      ...props,
      clientId: 'custom/python',
      customCodeSamples: [{ lang: 'python', source: 'client.planets.list()' }],
    })

    expect(snippet).toBe('client.planets.list()')
    expect(getLoadedPlugin('python', 'requests')).toBeUndefined()
  })
})
