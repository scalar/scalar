import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

for (const layout of ['modern', 'classic'] as const) {
  test(`displays selected operation extensions in the ${layout} standalone layout`, async ({ page }) => {
    const example = await serveExample({
      layout,
      showExtensions: ['x-scopes'],
      content: {
        openapi: '3.1.0',
        info: { title: 'Directory API', version: '1.0.0' },
        paths: {
          '/directories': {
            get: {
              summary: 'List directories',
              'x-scopes': ['directories', 'directories.readonly'],
              'x-hidden': 'INTERNAL_EXTENSION_MARKER',
              responses: { '200': { description: 'Success' } },
            },
          },
        },
      },
    })
    await page.goto(example)
    if (layout === 'classic') {
      await page.getByRole('button', { name: 'GET /directories' }).click()
    }
    await expect(page.getByText('x-scopes', { exact: true })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: /^directories$/ })).toBeVisible()
    await expect(page.getByRole('listitem').filter({ hasText: /^directories.readonly$/ })).toBeVisible()
    await expect(page.getByText('INTERNAL_EXTENSION_MARKER')).toHaveCount(0)
  })
}
