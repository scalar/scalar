import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onDocumentSelect', () => {
  test('fires when switching between documents', async ({ page }) => {
    const example = await serveExample({
      onDocumentSelect: () => {
        const win = window as unknown as Record<string, number>
        win.__documentSelectCount = (win.__documentSelectCount ?? 0) + 1
      },
      sources: [
        {
          title: 'First API',
          slug: 'first',
          content: {
            openapi: '3.1.1',
            info: { title: 'First API', version: '1.0.0' },
            paths: { '/a': { get: { summary: 'Get A', tags: ['A'] } } },
          },
        },
        {
          title: 'Second API',
          slug: 'second',
          content: {
            openapi: '3.1.1',
            info: { title: 'Second API', version: '1.0.0' },
            paths: { '/b': { get: { summary: 'Get B', tags: ['B'] } } },
          },
        },
      ],
    })

    await page.goto(example)

    // `onDocumentSelect` may also fire once for the initially loaded document, so
    // we capture the count just before switching and assert the switch increments it.
    await page.locator('.document-selector').getByRole('button').click()
    const countBeforeSwitch = await page.evaluate(
      () => (window as unknown as Record<string, number>).__documentSelectCount ?? 0,
    )

    await page.getByRole('option', { name: 'Second API' }).click()

    await expect
      .poll(() => page.evaluate(() => (window as unknown as Record<string, number>).__documentSelectCount ?? 0))
      .toBeGreaterThan(countBeforeSwitch)
  })
})
