import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  // Tags declared in non-alphabetical order
  tags: [{ name: 'Zebra' }, { name: 'Apple' }],
  paths: {
    '/zebra': { get: { summary: 'Get zebra', tags: ['Zebra'] } },
    '/apple': { get: { summary: 'Get apple', tags: ['Apple'] } },
  },
}

/** Vertical position of a sidebar link, used to compare ordering. */
const sidebarTop = async (page: Page, name: string) => {
  const box = await page.getByRole('navigation').getByRole('button', { name }).first().boundingBox()
  return box?.y ?? Number.POSITIVE_INFINITY
}

test.describe('tagsSorter', () => {
  test('preserves the document order by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    expect(await sidebarTop(page, 'Zebra')).toBeLessThan(await sidebarTop(page, 'Apple'))
  })

  test('sorts tags alphabetically when set to alpha', async ({ page }) => {
    const example = await serveExample({ tagsSorter: 'alpha', content })

    await page.goto(example)

    expect(await sidebarTop(page, 'Apple')).toBeLessThan(await sidebarTop(page, 'Zebra'))
  })
})
