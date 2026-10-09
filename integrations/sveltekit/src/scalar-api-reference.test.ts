import { describe, expect, it } from 'vitest'

import { ScalarApiReference } from './scalar-api-reference'

describe('scalar-api-reference', () => {
  it('returns the configured API reference as an HTML response', async () => {
    const handler = ScalarApiReference({
      pageTitle: 'SvelteKit API',
      url: 'https://example.com/openapi.json',
    })

    const response = handler()

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html')

    const html = await response.text()
    expect(html).toContain('<title>SvelteKit API</title>')
    expect(html).toContain("createApiReference('#app',")
    expect(html).toContain('https://example.com/openapi.json')
  })
})
