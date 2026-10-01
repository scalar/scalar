import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

for (const layout of ['modern', 'classic'] as const) {
  test(`displays selected operation extensions in the ${layout} standalone layout`, async ({ page }) => {
    const example = await serveExample({
      layout,
      showExtensions: ['x-scopes', 'x-metadata'],
      content: {
        openapi: '3.1.0',
        info: { title: 'Directory API', version: '1.0.0' },
        paths: {
          '/directories': {
            get: {
              summary: 'List directories',
              'x-scopes': ['directories', 'directories.readonly'],
              'x-metadata': { owner: 'Platform', policy: { enabled: false, retries: 0 } },
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
    await expect(page.getByText('"directories"', { exact: true })).toBeVisible()
    await expect(page.getByText('"directories.readonly"', { exact: true })).toBeVisible()
    await expect(page.getByText('INTERNAL_EXTENSION_MARKER')).toHaveCount(0)
    const scopes = page.getByRole('button', { name: 'x-scopes', exact: true })
    await scopes.focus()
    await scopes.press('Enter')
    await expect(scopes).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByText('"directories"', { exact: true })).toHaveCount(0)
    await scopes.press('Enter')
    await expect(page.getByText('"directories"', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'policy', exact: true }).click()
    await expect(page.getByText('false', { exact: true })).toBeVisible()
    await expect(page.getByText('0', { exact: true })).toBeVisible()
  })
}
