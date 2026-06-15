import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onSidebarClick', () => {
  test('fires with the href when a sidebar item is clicked', async ({ page }) => {
    const example = await serveExample({
      onSidebarClick: (href: string) => {
        ;(window as unknown as Record<string, unknown>).__sidebarHref = href
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/planets': { get: { summary: 'Get all planets', tags: ['Planets'] } },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('navigation').getByRole('button', { name: 'Get all planets' }).click()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__sidebarHref))
      .toBeTruthy()
  })
})
