import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/**
 * Telemetry only has an observable effect when the optional analytics plugin is
 * loaded, which it is not in the open-source standalone build. This is a smoke
 * test that disabling telemetry does not break rendering. Tighten it if the
 * analytics plugin becomes part of the standalone bundle.
 */
test.describe('telemetry', () => {
  test('renders the reference with telemetry disabled', async ({ page }) => {
    const example = await serveExample({
      telemetry: false,
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
