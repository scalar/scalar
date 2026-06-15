import { test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('onLoaded', () => {
  test('fires once the references are loaded', async ({ page }) => {
    const example = await serveExample({
      onLoaded: () => {
        ;(window as unknown as Record<string, unknown>).__onLoadedCalled = true
      },
      content: {
        openapi: '3.1.1',
        info: { title: 'Galaxy API', version: '1.0.0' },
        paths: {},
      },
    })

    await page.goto(example)

    await page.waitForFunction(() => (window as unknown as Record<string, unknown>).__onLoadedCalled === true)
  })
})
