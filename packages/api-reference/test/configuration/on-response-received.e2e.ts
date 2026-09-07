import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onResponseReceived', () => {
  test('shows the replacement response from the configuration callback', async ({ page }) => {
    const example = await serveExample({
      proxyUrl: '',
      onResponseReceived: async ({ response }) => {
        await response.text()
        return Response.json(
          { message: 'Intercepted response' },
          {
            status: 201,
            statusText: 'Created',
            headers: { 'x-intercepted': 'yes' },
          },
        )
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Response interception', version: '1.0.0' },
        servers: [{ url: '/' }],
        paths: { '/ping': { get: { summary: 'Ping', responses: { '200': { description: 'Success' } } } } },
      },
    })

    await page.goto(example)
    await page.getByRole('button', { name: 'Test Request (get /ping)', exact: true }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Send Request' }).click()

    await expect(dialog.getByText('201 Created')).toBeVisible()
    await expect(dialog.getByText('Intercepted response', { exact: false })).toBeVisible()
  })
})
