import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test('uses configured URL-encoded names in the reference, editor, snippets, and sent request', async ({
  page,
}, testInfo) => {
  const example = await serveExample({
    multipartNaming: 'indexed-dot',
    proxyUrl: '',
    defaultHttpClient: { targetKey: 'shell', clientKey: 'curl' },
    content: {
      openapi: '3.0.4',
      info: { title: 'Contact form', version: '1.0.0' },
      servers: [{ url: '/' }],
      paths: {
        '/contacts': {
          post: {
            requestBody: {
              content: {
                'application/x-www-form-urlencoded': {
                  schema: {
                    type: 'object',
                    required: ['contacts', 'profile', 'tags'],
                    properties: {
                      contacts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
                      profile: { type: 'object', properties: { city: { type: 'string' } } },
                      tags: { type: 'array', items: { type: 'string' } },
                    },
                  },
                  example: { contacts: [{ name: 'Ada' }], profile: { city: 'New York' }, tags: ['one', 'two'] },
                },
              },
            },
            responses: { '204': { description: 'Saved' } },
          },
        },
      },
    },
  })
  await page.route(`${example}/contacts`, (route) => route.fulfill({ status: 204 }))
  await page.goto(example)
  await expect(page.locator('pre', { hasText: 'contacts%5B0%5D.name=Ada' })).toBeVisible()
  await page.getByRole('button', { name: 'Test Request (post /contacts)', exact: true }).click()
  const dialog = page.getByRole('dialog')
  const nameRow = dialog.getByRole('row').filter({
    has: page.getByRole('checkbox', { name: 'Include contacts[0].name in request', exact: true }),
  })
  await nameRow.getByRole('combobox', { name: 'Value', exact: true }).fill('Grace & Ada')
  await dialog.getByRole('heading', { name: 'Code Snippet (Collapsed)' }).click()
  await expect(dialog.locator('pre', { hasText: 'contacts%5B0%5D.name=Grace & Ada' })).toBeVisible()
  const outgoing = page.waitForRequest(`${example}/contacts`)
  const incoming = page.waitForResponse(`${example}/contacts`)
  await dialog.getByRole('button', { name: /^Send Request/ }).click()
  const request = await outgoing
  expect(request.headers()['content-type']).toContain('application/x-www-form-urlencoded')
  expect([...new URLSearchParams(request.postData() ?? '').entries()]).toStrictEqual([
    ['contacts[0].name', 'Grace & Ada'],
    ['profile.city', 'New York'],
    ['tags', 'one'],
    ['tags', 'two'],
  ])
  expect((await incoming).status()).toBe(204)
  await expect(dialog.getByRole('link', { name: '204 No Content', exact: true })).toBeVisible()
  const screenshot = testInfo.outputPath('indexed_dot_urlencoded.png')
  await page.screenshot({ path: screenshot })
  await testInfo.attach('indexed_dot_urlencoded', { path: screenshot, contentType: 'image/png' })
})

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
