import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('redirect', () => {
  test('redirects to the correct operation', async ({ page }) => {
    const example = await serveExample({
      redirect: (hash) => hash.replace('#foobar', '#tag/authentication/post/auth/token'),
    })

    // Make the viewport smaller to test scrolling
    await page.setViewportSize({ width: 1024, height: 200 })

    await page.goto(`${example}/#foobar`)

    await expect(page.getByRole('heading', { name: 'Get a token', level: 3 })).toBeInViewport()
  })
})
