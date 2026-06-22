import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onServerChange', () => {
  test('fires when the server is changed', async ({ page }) => {
    const example = await serveExample({
      onServerChange: (server: string) => {
        ;(window as unknown as Record<string, unknown>).__server = server
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }, { url: 'https://staging.example.com' }],
        paths: {
          '/planets': { get: { summary: 'Get all planets', tags: ['Planets'] } },
        },
      },
    })

    await page.goto(example)

    // Open the server dropdown and pick the second server
    await page.getByRole('button', { name: 'https://api.example.com' }).first().click()
    await page.getByText('https://staging.example.com').click()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__server))
      .toBe('https://staging.example.com')
  })
})
