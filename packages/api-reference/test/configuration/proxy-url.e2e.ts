import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('proxyUrl', () => {
  test('routes cross-origin requests through the configured proxy', async ({ page }) => {
    const example = await serveExample({
      proxyUrl: 'https://proxy.example.com',
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        // A cross-origin server forces the request through the proxy
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/data': { get: { summary: 'Get data', tags: ['Data'] } },
        },
      },
    })

    // Catch (and stub) any request that hits the proxy
    await page.route('https://proxy.example.com/**', (route) => route.fulfill({ status: 200, body: '{}' }))

    await page.goto(example)

    await page.getByRole('button', { name: 'Test Request (get /data)', exact: true }).click()
    await expect(page.getByRole('dialog')).toBeVisible()

    // Match on the parsed origin so the check cannot be fooled by a host like
    // `proxy.example.com.evil.com`
    const proxyRequest = page.waitForRequest((request) => new URL(request.url()).origin === 'https://proxy.example.com')

    await page.getByRole('dialog').getByRole('button', { name: 'Send Request' }).click()

    await proxyRequest
  })
})
