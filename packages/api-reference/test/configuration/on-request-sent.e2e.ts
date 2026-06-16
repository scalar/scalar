import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onRequestSent', () => {
  test('fires once a request has been sent and a response received', async ({ page }) => {
    const example = await serveExample({
      onRequestSent: (request: string) => {
        ;(window as unknown as Record<string, unknown>).__requestSent = request
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        // A relative server resolves to the example origin, which responds 200,
        // so the response-received hook backing onRequestSent fires.
        servers: [{ url: '/' }],
        paths: {
          '/ping': { get: { summary: 'Ping', tags: ['Health'] } },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Test Request (get /ping)', exact: true }).click()

    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('dialog').getByRole('button', { name: 'Send Request' }).click()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__requestSent))
      .toBeTruthy()
  })
})
