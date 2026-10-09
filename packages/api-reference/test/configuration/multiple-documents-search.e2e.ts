import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('multi-document selector search', () => {
  test('filters titles, supports keyboard selection, and preserves document routing', async ({ page }) => {
    const sources = [
      {
        title: '用户 API',
        slug: 'users',
        content: {
          openapi: '3.1.1',
          info: { title: '用户 API', version: '1.0.0' },
          paths: { '/users': { get: { summary: 'List users' } } },
        },
      },
      {
        title: 'Billing API',
        slug: 'billing',
        content: {
          openapi: '3.1.1',
          info: { title: 'Billing API', version: '1.0.0' },
          paths: { '/invoices': { get: { summary: 'List invoices' } } },
        },
      },
      {
        title: '设备 API',
        slug: 'devices',
        content: {
          openapi: '3.1.1',
          info: { title: '设备 API', version: '1.0.0' },
          paths: { '/devices': { get: { summary: 'List devices' } } },
        },
      },
    ]
    const example = await serveExample({
      sources: [
        ...sources,
        ...sources.map((source, index) => ({
          ...source,
          title: `Additional document ${index + 1}`,
          slug: `additional-${source.slug}`,
        })),
      ],
    })

    await page.goto(example)
    await expect(page.getByRole('heading', { name: '用户 API', level: 1 })).toBeVisible()

    const selector = page.locator('.document-selector')
    await selector.getByRole('button').click()

    const input = selector.getByRole('combobox')
    await expect(selector.getByRole('option')).toHaveCount(6)

    await input.fill('Billing')
    await expect(selector.getByRole('option')).toHaveCount(1)
    await expect(selector.getByRole('option', { name: 'Billing API' })).toBeVisible()

    await input.fill('设备')
    await expect(selector.getByRole('option')).toHaveCount(1)
    await expect(selector.getByRole('option', { name: '设备 API' })).toBeVisible()

    await input.fill('missing')
    await expect(selector.getByRole('status')).toHaveText('No results found')
    await expect(selector.getByRole('option')).toHaveCount(0)

    await input.fill('')
    await expect(selector.getByRole('option')).toHaveCount(6)
    await input.press('ArrowDown')
    await input.press('Enter')

    await expect(page.getByRole('heading', { name: 'Billing API', level: 1 })).toBeVisible()
    await expect.poll(() => new URL(page.url()).hash).toContain('#billing/')

    const selectedUrl = page.url()
    await selector.getByRole('button').click()
    await selector.getByRole('combobox').press('Escape')
    await expect(selector.getByRole('combobox')).toBeHidden()
    expect(page.url()).toBe(selectedUrl)
  })
})
