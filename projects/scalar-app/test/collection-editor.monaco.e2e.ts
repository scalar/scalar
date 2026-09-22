import { expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/**
 * Seeded local workspace document `drafts` includes GET `/` (see createAndPersistWorkspace in app-state).
 * Web playground uses HTML5 history (`createWebHistory`), so the path is the real URL path (no `#`).
 *
 * Land on the operation overview, then navigate via the workspace event bus (`ui:navigate` →
 * `operation.editor`). Same path the app uses internally; `window.dumpAppState` is exposed for debugging in
 * {@link App.vue}.
 */
const EDITOR_ROUTE = '/@local/default/document/drafts/path/%252F/method/get/editor'

test.describe('collection-editor.monaco.e2e', () => {
  /**
   * Monaco + monaco-yaml spin up several Web Workers; tearing them down can take longer than the
   * Playwright default 30s timeout when the suite runs with `workers: '100%'` and the box is CPU-bound.
   * Bumping the per-test budget keeps this test stable in parallel runs without affecting solo runs.
   */
  test.setTimeout(120_000)

  test('validates path names without rejecting valid OpenAPI 3.1 and 3.2 paths', async ({ page }) => {
    await page.goto('/')
    await waitForScalarAppShellReady(page)
    await page.goto(EDITOR_ROUTE)

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    const modifier = await page.evaluate(() => (navigator.platform.startsWith('Mac') ? 'Meta' : 'Control'))
    const editor = page.locator('.monaco-editor').first()
    await editor.waitFor({ state: 'visible' })

    await page.getByRole('button', { name: /^Problems/ }).click()

    for (const openapi of ['3.1.0', '3.2.0']) {
      const setPaths = async (path: string): Promise<void> => {
        await editor.locator('.view-line').first().click()
        await page.keyboard.press(`${modifier}+a`)
        await page.evaluate(
          (text) => navigator.clipboard.writeText(text),
          JSON.stringify(
            {
              openapi,
              info: { title: 'Editor compatibility', version: '1.0.0' },
              paths: {
                [path]: { get: { responses: { '200': { description: 'OK' } } } },
                'x-description': 'An extension alongside the path',
              },
            },
            null,
            2,
          ),
        )
        await page.keyboard.press(`${modifier}+v`)
      }

      // An invalid document first proves the worker has finished validating before we expect no problems.
      await setPaths('users')
      await expect(page.getByRole('button', { name: /Property users is not allowed/ })).toBeVisible()
      await setPaths('/users')
      await expect(page.getByRole('button', { name: 'Problems 0 0', exact: true })).toBeVisible()
    }
  })

  test('Monaco mounts and YAML mode does not throw (monaco-yaml + workers)', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })
    const pageErrors: string[] = []
    page.on('pageerror', (error) => {
      // "Canceled" is thrown by Chromium when in-flight fetch requests or Monaco workers are
      // aborted during SPA navigation — it is not a real error.
      if (error.message !== 'Canceled') {
        pageErrors.push(error.message)
      }
    })

    await page.goto('/', { waitUntil: 'load', timeout: 60_000 })

    await waitForScalarAppShellReady(page)

    await page.goto(EDITOR_ROUTE, { waitUntil: 'load', timeout: 60_000 })

    await expect(page).toHaveURL(/\/method\/get\/editor/)

    await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 60_000 })
    await page.getByRole('tab', { name: 'YAML' }).click()
    await page.waitForTimeout(2500)

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    // Console errors can include unrelated third-party telemetry script failures in CI.
    // expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })
})
