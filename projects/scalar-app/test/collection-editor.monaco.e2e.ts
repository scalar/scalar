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
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([])
  })
})
