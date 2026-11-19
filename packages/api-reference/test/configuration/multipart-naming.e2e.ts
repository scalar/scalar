import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

for (const layout of ['classic', 'modern'] as const) {
  test(`uses configured multipart names in the ${layout} reference and Test Request`, async ({ page }) => {
    const example = await serveExample({
      layout,
      multipartNaming: 'indexed-dot',
      proxyUrl: '',
      defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
      content: {
        openapi: '3.0.4',
        info: { title: 'Certificate upload', version: '1.0.0' },
        servers: [{ url: '/' }],
        paths: {
          '/certificates': {
            post: {
              requestBody: {
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      required: ['certificates'],
                      properties: {
                        certificates: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              file: { type: 'string', format: 'binary' },
                              name: { type: 'string', example: 'Ada' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              responses: { '204': { description: 'Uploaded' } },
            },
          },
        },
      },
    })

    await page.route(`${example}/certificates`, (route) => route.fulfill({ status: 204 }))
    await page.goto(example)
    if (layout === 'classic') {
      await page.getByRole('button', { name: /^POST \/certificates/ }).click()
    }

    await expect(page.locator('pre', { hasText: 'certificates[0].file=@filename' })).toBeVisible()
    await page.getByRole('button', { name: 'Test Request (post /certificates)', exact: true }).click()

    const dialog = page.getByRole('dialog')
    const fileChooser = page.waitForEvent('filechooser')
    await dialog.getByRole('button', { name: 'Select File for certificates[0].file', exact: true }).click()
    await (await fileChooser).setFiles({
      name: 'certificate.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('certificate'),
    })

    await dialog.getByRole('heading', { name: 'Code Snippet (Collapsed)' }).click()
    await expect(dialog.locator('pre', { hasText: 'certificates[0].file=@certificate.txt' })).toBeVisible()

    const outgoing = page.waitForRequest(`${example}/certificates`)
    await dialog.getByRole('button', { name: /^Send Request/ }).click()
    expect((await outgoing).postData()).toContain('name="certificates[0].file"; filename="certificate.txt"')
  })
}
