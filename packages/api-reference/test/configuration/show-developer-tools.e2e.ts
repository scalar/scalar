import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('showDeveloperTools', () => {
  test('shows developer tools when enabled', async ({ page }) => {
    const example = await serveExample({
      // TODO: Remove this once we release the next version (after 1.39.3)
      // @ts-expect-error - override the default value in serveExample
      showToolbar: 'always',
      showDeveloperTools: 'always',
    })

    await page.goto(example)

    await expect(page.getByLabel('Developer Tools')).toBeVisible()
  })

  test('hides developer tools if set to never', async ({ page }) => {
    const example = await serveExample({
      // TODO: Remove this once we release the next version (after 1.39.3)
      // @ts-expect-error - override the default value in serveExample
      showToolbar: 'never',
      showDeveloperTools: 'never',
    })

    await page.goto(example)

    await expect(page.getByLabel('Developer Tools')).toBeHidden()
  })
})
