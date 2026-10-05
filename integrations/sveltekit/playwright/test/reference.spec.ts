import { expect, test } from '@playwright/test'

test.describe('reference', () => {
  test('serves the Scalar HTML document', async ({ request }) => {
    const response = await request.get('/')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('text/html')

    const html = await response.text()
    expect(html).toContain('<title>SvelteKit compatibility</title>')
    expect(html).toContain("createApiReference('#app',")
    expect(html).toContain('https://example.com/openapi.json')
  })
})
