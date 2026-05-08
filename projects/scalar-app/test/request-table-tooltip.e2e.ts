/**
 * Snapshot: request table parameter info popover (narrow max width + wrapped description).
 *
 * Seeds a dedicated workspace document at runtime (does not change default app-state seed data).
 *
 * Refresh baseline from `projects/scalar-app`:
 * `CI=1 pnpm exec playwright test test/request-table-tooltip.e2e.ts --update-snapshots`
 */
import { type Page, type PageAssertionsToHaveScreenshotOptions, expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/** Matches {@link seedRequestTableTooltipDocument}; used in the example URL path. */
const TOOLTIP_TEST_DOCUMENT = 'e2e-request-table-tooltip'

const EXAMPLE_ROUTE = `/@local/default/document/${TOOLTIP_TEST_DOCUMENT}/path/%252F/method/get/example/default`

const viewport = { width: 1280, height: 800 } as const

const shotOptions = {
  animations: 'disabled',
} satisfies PageAssertionsToHaveScreenshotOptions

const waitForFonts = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

/**
 * Adds an OpenAPI document with GET `/` and one query parameter that carries a long description,
 * so the request table info popover renders wrapped markdown.
 */
const seedRequestTableTooltipDocument = async (page: Page): Promise<void> => {
  /** Document name is passed explicitly — `page.evaluate` runs in the browser and cannot close over Node-scope constants. */
  await page.evaluate(async (documentName: string) => {
    const store = window.dumpAppState().store.value

    if (!store) {
      throw new Error('Workspace store is not ready')
    }

    const ok = await store.addDocument({
      name: documentName,
      document: {
        openapi: '3.1.0',
        info: {
          title: 'E2E request table tooltip',
          version: '1.0.0',
        },
        paths: {
          '/': {
            get: {
              summary: 'Tooltip width snapshot',
              parameters: [
                {
                  name: 'snapshotTooltipWidth',
                  in: 'query',
                  description:
                    'E2E snapshot: this text is long on purpose so the request table info popover wraps within a narrow max width instead of stretching across the layout.',
                  schema: { type: 'string' },
                },
              ],
            },
          },
        },
      },
    })

    if (!ok) {
      throw new Error('store.addDocument returned false')
    }
  }, TOOLTIP_TEST_DOCUMENT)
}

test.describe('request-table-tooltip.e2e', () => {
  test.setTimeout(120_000)

  test('request table tooltip popover snapshot', async ({ page }) => {
    await page.setViewportSize(viewport)

    await page.goto('/', { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)

    await seedRequestTableTooltipDocument(page)

    await page.goto(EXAMPLE_ROUTE, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/example\/default/)

    const infoRow = page.locator('[id="snapshotTooltipWidth"]')
    await expect(infoRow).toBeVisible({ timeout: 30_000 })

    await infoRow.getByRole('button', { name: 'More Information' }).click()

    const panel = page.getByTestId('request-table-tooltip-content')
    await expect(panel).toBeVisible({ timeout: 15_000 })

    await waitForFonts(page)
    await expect(panel).toHaveScreenshot('request-table-tooltip-popover.png', shotOptions)
  })
})
