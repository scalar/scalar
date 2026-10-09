import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('external examples', () => {
  test('loads only visible selections and shares their payload with Test Request', async ({ page }, testInfo) => {
    const downloads: string[] = []
    await page.route('https://examples.test/**', async (route) => {
      downloads.push(route.request().url())
      await route.fulfill({ json: { shippingType: route.request().url().endsWith('/0') ? 'standard' : 'express' } })
    })
    let sentBody: unknown
    await page.route('https://shipping.test/shipments', async (route) => {
      sentBody = route.request().postDataJSON()
      await route.fulfill({ json: { accepted: true } })
    })
    const example = await serveExample({
      proxyUrl: '',
      content: {
        openapi: '3.1.0',
        info: { title: 'Lazy shipping examples', version: '1', description: 'Introduction.\n\n'.repeat(100) },
        servers: [{ url: 'https://shipping.test' }],
        paths: {
          '/shipments': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    examples: Object.fromEntries(
                      Array.from({ length: 1200 }, (_, index) => [
                        `example-${index}`,
                        { summary: `Shipping example ${index}`, externalValue: `https://examples.test/${index}` },
                      ]),
                    ),
                  },
                },
              },
              responses: { '200': { description: 'Accepted' } },
            },
          },
        },
      },
    })
    const started = Date.now()
    await page.goto(example)
    await expect(page.getByRole('heading', { name: 'Lazy shipping examples', exact: true })).toBeVisible()
    const initialRenderMs = Date.now() - started
    expect(downloads).toEqual([])
    const testRequest = page.getByRole('button', { name: 'Test Request (post /shipments)', exact: true })
    const selectedAt = Date.now()
    await page.getByRole('link', { name: /\/shipments/ }).click()
    const card = page.locator('.request-card')
    await expect(card).toContainText('standard')
    await testInfo.attach('lazy-loading-metrics', {
      body: JSON.stringify({
        exampleCount: 1200,
        initialRenderMs,
        selectedExampleMs: Date.now() - selectedAt,
        initialPayloadRequests: 0,
        selectedPayloadRequests: downloads.length,
      }),
      contentType: 'application/json',
    })
    expect(downloads).toEqual(['https://examples.test/0'])
    await card.getByTestId('example-picker').click()
    await page.getByRole('option', { name: 'Shipping example 1', exact: true }).click()
    await expect(card).toContainText('express')
    expect(downloads).toEqual(['https://examples.test/0', 'https://examples.test/1'])
    await card.screenshot({ path: testInfo.outputPath('external-example-preview.png'), animations: 'disabled' })
    await testRequest.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.cm-content').filter({ hasText: 'shippingType' })).toContainText('express')
    await expect(page.locator('.scalar-container.scalar-client--open')).toHaveCSS('opacity', '1')
    await page.screenshot({ path: testInfo.outputPath('external-example-editor.png'), animations: 'disabled' })
    await dialog.getByRole('button', { name: /Send Request/ }).click()
    await expect.poll(() => sentBody).toEqual({ shippingType: 'express' })
    expect(downloads).toEqual(['https://examples.test/0', 'https://examples.test/1'])
  })
  test('blocks sending a failed external example until retry succeeds', async ({ page }, testInfo) => {
    let downloads = 0
    await page.route('https://examples.test/retry', async (route) => {
      downloads += 1
      await route.fulfill(
        downloads === 1 ? { status: 503, body: 'Unavailable' } : { json: { shippingType: 'retried' } },
      )
    })
    const example = await serveExample({
      proxyUrl: '',
      content: {
        openapi: '3.1.0',
        info: { title: 'Retry an external example', version: '1' },
        paths: {
          '/shipments': {
            post: {
              requestBody: {
                content: {
                  'application/json': {
                    examples: {
                      standard: { externalValue: 'https://examples.test/retry' },
                    },
                  },
                },
              },
              responses: { '200': { description: 'Accepted' } },
            },
          },
        },
      },
    })
    await page.goto(example)
    const testRequest = page.getByRole('button', { name: 'Test Request (post /shipments)', exact: true })
    await testRequest.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Could not load this example.')
    await expect(dialog.getByRole('button', { name: /Send Request/ })).toBeDisabled()
    await expect(page.locator('.scalar-container.scalar-client--open')).toHaveCSS('opacity', '1')
    await page.screenshot({ path: testInfo.outputPath('external-example-retry.png'), animations: 'disabled' })
    await dialog.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(dialog.locator('.cm-content').filter({ hasText: 'shippingType' })).toContainText('retried')
    await expect(dialog.getByRole('button', { name: /Send Request/ })).toBeEnabled()
    expect(downloads).toBe(2)
  })
})
