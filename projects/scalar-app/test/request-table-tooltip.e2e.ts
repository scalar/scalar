/**
 * Snapshot: request table parameter info popover (narrow max width + wrapped description).
 *
 * Seeds a dedicated workspace document at runtime (does not change default app-state seed data).
 * Navigates via the sidebar (Back → collection → operation) so IndexedDB persistence never races a full reload.
 *
 * Refresh baseline from `projects/scalar-app`:
 * `CI=1 pnpm exec playwright test test/request-table-tooltip.e2e.ts --update-snapshots`
 */
import { type Page, type PageAssertionsToHaveScreenshotOptions, expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/** Matches {@link seedRequestTableTooltipDocument}; used in route assertions and OpenAPI `name`. */
const TOOLTIP_TEST_DOCUMENT = 'e2e-request-table-tooltip'

/** {@link seedRequestTableTooltipDocument} sets `info.title`; sidebar lists documents by this title. */
const TOOLTIP_DOCUMENT_SIDEBAR_TITLE = 'E2E request table tooltip'

/** OpenAPI operation summary; sidebar lists operations by summary when present. */
const TOOLTIP_OPERATION_SIDEBAR_TITLE = 'Tooltip width snapshot'

const DOCUMENT_DRAFTS_OVERVIEW = '/@local/default/document/drafts/overview'

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

    await page.goto(DOCUMENT_DRAFTS_OVERVIEW, { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)
    await expect(page).toHaveURL(/\/document\/drafts\//)

    await seedRequestTableTooltipDocument(page)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/get-started/)

    const sidebar = page.locator('aside')
    await sidebar.getByText(TOOLTIP_DOCUMENT_SIDEBAR_TITLE, { exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/document/${TOOLTIP_TEST_DOCUMENT}/`))

    await sidebar.getByRole('button', { name: TOOLTIP_OPERATION_SIDEBAR_TITLE }).click()
    await expect(page).toHaveURL(/\/example\/default/)

    const infoRow = page.locator('#snapshotTooltipWidth')
    await infoRow.waitFor({ state: 'visible', timeout: 60_000 })

    await infoRow.getByRole('button', { name: 'More Information' }).click()

    const panel = page.getByTestId('request-table-tooltip-content')
    await expect(panel).toBeVisible({ timeout: 15_000 })

    await waitForFonts(page)
    await expect(panel).toHaveScreenshot('request-table-tooltip-popover.png', shotOptions)
  })
})
