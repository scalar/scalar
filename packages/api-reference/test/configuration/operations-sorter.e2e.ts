import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/users': {
      // Declared post-before-get so default alpha ordering is observable
      post: { summary: 'Create user', tags: ['Users'] },
      get: { summary: 'Get users', tags: ['Users'] },
    },
  },
}

/** Vertical position of a sidebar link, used to compare ordering. */
const sidebarTop = async (page: Page, name: string) => {
  const box = await page.getByRole('navigation').getByRole('button', { name }).first().boundingBox()
  return box?.y ?? Number.POSITIVE_INFINITY
}

test.describe('operationsSorter', () => {
  test('sorts operations alphabetically by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    // 'Create user' sorts before 'Get users' alphabetically
    expect(await sidebarTop(page, 'Create user')).toBeLessThan(await sidebarTop(page, 'Get users'))
  })

  test('sorts operations by HTTP method when set to method', async ({ page }) => {
    const example = await serveExample({ operationsSorter: 'method', content })

    await page.goto(example)

    // 'method' ordering puts get before post
    expect(await sidebarTop(page, 'Get users')).toBeLessThan(await sidebarTop(page, 'Create user'))
  })
})
