import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onShowMore', () => {
  test('fires when the Show more button is clicked', async ({ page }) => {
    const example = await serveExample({
      onShowMore: (tagId: string) => {
        ;(window as unknown as Record<string, unknown>).__showMoreTagId = tagId
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Test API', version: '1.0.0' },
        // The "Show more" button only appears for a collapsed tag when more than
        // one tag exists, so we need at least two tags. The first opens by
        // default; the second stays collapsed and shows the button.
        paths: {
          '/planets': { get: { summary: 'Get all planets', tags: ['Planets'] } },
          '/moons': { get: { summary: 'Get all moons', tags: ['Moons'] } },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Show all Moons endpoints' }).click()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__showMoreTagId))
      .toBeTruthy()
  })
})
