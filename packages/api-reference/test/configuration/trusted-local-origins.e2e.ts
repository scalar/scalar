import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('trustedLocalOrigins', () => {
  test('opens the configured HTTP authorization origin from API Reference', async ({ context, page }) => {
    const origin = 'http://auth.dev.internal:8080'
    const example = await serveExample({
      trustedLocalOrigins: [origin],
      content: {
        openapi: '3.1.1',
        info: { title: 'Trusted OAuth origin', version: '1.0.0' },
        paths: {},
        security: [{ oauth2: [] }],
        components: {
          securitySchemes: {
            oauth2: {
              type: 'oauth2',
              flows: {
                implicit: {
                  authorizationUrl: `${origin}/authorize`,
                  scopes: {},
                  'x-scalar-client-id': 'test-client',
                },
              },
            },
          },
        },
      },
    })

    await context.route(`${origin}/authorize?**`, (route) => route.fulfill({ body: 'Authorization page' }))
    await page.goto(example)
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('button', { name: 'Authorize', exact: true }).click(),
    ])
    await expect(popup.getByText('Authorization page')).toBeVisible()
    expect(new URL(popup.url()).origin).toBe(origin)
    await popup.close()
  })

  test('sends the embedded client request directly to the configured API origin', async ({ page }) => {
    const origin = 'https://api.dev.internal:8443'
    const example = await serveExample({
      proxyUrl: 'https://proxy.example.com',
      trustedLocalOrigins: [origin],
      content: {
        openapi: '3.1.1',
        info: { title: 'Trusted API origin', version: '1.0.0' },
        servers: [{ url: origin }],
        paths: { '/data': { get: { responses: { '200': { description: 'OK' } } } } },
      },
    })

    await page.route('https://proxy.example.com/**', (route) => route.abort())
    await page.route(`${origin}/data`, (route) =>
      route.fulfill({
        json: { direct: true },
        headers: { 'Access-Control-Allow-Origin': '*' },
      }),
    )
    await page.goto(example)
    await page.getByRole('button', { name: 'Test Request (get /data)', exact: true }).click()

    const [response] = await Promise.all([
      page.waitForResponse(
        (candidate) => candidate.url() === `${origin}/data` && candidate.request().method() === 'GET',
      ),
      page.getByRole('dialog').getByRole('button', { name: 'Send Request' }).click(),
    ])
    expect(response.status()).toBe(200)
    expect(await response.json()).toStrictEqual({ direct: true })
  })
})
