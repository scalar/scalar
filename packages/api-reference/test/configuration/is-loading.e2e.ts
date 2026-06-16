import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/**
 * `isLoading` is documented as showing a loading state in the intro section.
 * It is not currently wired to an observable element in the standalone
 * reference, so this is a smoke test that the reference still renders when the
 * flag is enabled. Tighten this assertion once the loading state is exposed.
 */
test.describe('isLoading', () => {
  test('still renders the reference when loading is enabled', async ({ page }) => {
    const example = await serveExample({
      isLoading: true,
      content: {
        openapi: '3.1.1',
        info: { title: 'Galaxy API', version: '1.0.0' },
        paths: {},
      },
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Galaxy API', level: 1 })).toBeVisible()
  })
})
