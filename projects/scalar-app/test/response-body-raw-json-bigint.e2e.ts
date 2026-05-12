/**
 * Snapshot: response Body → Raw JSON shows unsafe integer digits without IEEE double rounding
 * (regression guard for text-based formatting vs JSON.parse / JSON.stringify).
 *
 * Intercepts GET to a dedicated loopback port and returns JSON with id 9007199254740993; the
 * incorrect double round-trip would display 9007199254740992.
 *
 * Refresh baseline from `projects/scalar-app`:
 * `CI=1 pnpm exec playwright test test/response-body-raw-json-bigint.e2e.ts --update-snapshots`
 */
import { type Page, type PageAssertionsToHaveScreenshotOptions, expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/** Must match {@link seedBigIntResponseDocument} `name` (sidebar routing). */
const BIGINT_TEST_DOCUMENT = 'e2e-response-body-raw-bigint'

/** Matches {@link seedBigIntResponseDocument} `info.title`. */
const BIGINT_DOCUMENT_SIDEBAR_TITLE = 'E2E response raw bigint'

/** Matches {@link seedBigIntResponseDocument} operation `summary`. */
const BIGINT_OPERATION_SIDEBAR_TITLE = 'BigInt raw JSON snapshot'

/** Dedicated port so the intercepted origin never collides with the Vite app. */
const MOCK_SERVER_ORIGIN = 'http://127.0.0.1:54321'

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

const BIG_INT_ID = '9007199254740993'
const WRONG_ROUNDED_ID = '9007199254740992'

const registerBigIntMockRoutes = async (page: Page): Promise<void> => {
  await page.route(`${MOCK_SERVER_ORIGIN}/**`, async (route) => {
    const request = route.request()
    if (request.method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, HEAD, OPTIONS',
          'access-control-allow-headers': '*',
        },
      })
      return
    }

    if (request.method() === 'GET' && request.url().startsWith(`${MOCK_SERVER_ORIGIN}/bigint`)) {
      await route.fulfill({
        status: 200,
        body: `{"id":${BIG_INT_ID}}`,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'access-control-allow-origin': '*',
        },
      })
      return
    }

    await route.fulfill({
      status: 404,
      body: 'not found',
      headers: { 'access-control-allow-origin': '*' },
    })
  })
}

const seedBigIntResponseDocument = async (page: Page): Promise<void> => {
  await page.evaluate(
    async ({ documentName, serverUrl }: { documentName: string; serverUrl: string }) => {
      const store = window.dumpAppState().store.value

      if (!store) {
        throw new Error('Workspace store is not ready')
      }

      const ok = await store.addDocument({
        name: documentName,
        document: {
          openapi: '3.1.0',
          info: {
            title: 'E2E response raw bigint',
            version: '1.0.0',
          },
          servers: [{ url: serverUrl }],
          paths: {
            '/bigint': {
              get: {
                summary: 'BigInt raw JSON snapshot',
                responses: {
                  '200': {
                    description: 'JSON with an integer beyond Number.MAX_SAFE_INTEGER',
                  },
                },
              },
            },
          },
        },
      })

      if (!ok) {
        throw new Error('store.addDocument returned false')
      }
    },
    { documentName: BIGINT_TEST_DOCUMENT, serverUrl: MOCK_SERVER_ORIGIN },
  )
}

test.describe('response-body-raw-json-bigint.e2e', () => {
  test.setTimeout(120_000)

  test('response raw JSON body snapshot preserves unsafe integer digits', async ({ page }) => {
    await registerBigIntMockRoutes(page)

    await page.setViewportSize(viewport)

    await page.goto(DOCUMENT_DRAFTS_OVERVIEW, { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)
    await expect(page).toHaveURL(/\/document\/drafts\//)

    await seedBigIntResponseDocument(page)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/get-started/)

    const sidebar = page.locator('aside')
    await sidebar.getByText(BIGINT_DOCUMENT_SIDEBAR_TITLE, { exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/document/${BIGINT_TEST_DOCUMENT}/`))

    await sidebar.getByRole('button', { name: BIGINT_OPERATION_SIDEBAR_TITLE }).click()
    await expect(page).toHaveURL(/\/example\/default/)

    const sendButton = page.locator('[data-addressbar-action="send"]').first()
    await sendButton.click()
    await expect(sendButton).not.toBeDisabled({ timeout: 60_000 })

    // await page.locator('main').getByRole('button', { name: 'Raw', exact: true }).click()

    const rawBlock = page.locator('.body-raw').first()
    await expect(rawBlock).toBeVisible({ timeout: 15_000 })
    await expect(rawBlock).toContainText(BIG_INT_ID)
    await expect(rawBlock).not.toContainText(WRONG_ROUNDED_ID)

    await waitForFonts(page)
    await expect(rawBlock).toHaveScreenshot('response-raw-json-bigint.png', shotOptions)
  })
})
