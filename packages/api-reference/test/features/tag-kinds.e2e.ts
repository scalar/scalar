import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.2.1',
  info: { title: 'Tag categories', version: '1.0.0' },
  tags: [
    { name: 'Users', kind: 'nav' },
    { name: 'Beta', summary: 'Preview', kind: 'badge' },
    { name: 'Partners', kind: 'audience' },
  ],
  paths: {
    '/users': {
      get: { tags: ['Users', 'Beta', 'Partners'], summary: 'List users', responses: { '200': { description: 'OK' } } },
    },
    '/status': {
      get: { tags: ['Beta', 'Partners'], summary: 'Get status', responses: { '200': { description: 'OK' } } },
    },
  },
}

for (const layout of ['modern', 'classic'] as const) {
  test(`renders tag categories in the ${layout} layout`, async ({ page }) => {
    const url = await serveExample({ content, layout, hideModels: true, defaultOpenAllTags: true })
    await page.goto(url)
    await expect(page.getByRole('heading', { name: 'Users', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Preview', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Partners', exact: true })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /List users/ })).toHaveCount(1)
    await expect(page.getByRole('heading', { name: /Get status/ })).toHaveCount(1)
    await expect(page.getByText('Preview', { exact: true })).toHaveCount(2)
    await expect(page.getByText('Audience: Partners', { exact: true })).toHaveCount(2)
  })
}
