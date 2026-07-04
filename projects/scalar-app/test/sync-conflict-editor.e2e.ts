import { type Page, expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/**
 * Snapshot tests for the sync conflict (three-way merge) editor.
 *
 * The harness route renders `SyncConflictResolutionEditor` with a
 * deterministic fixture (see `SyncConflictEditorHarness.vue`): two conflicts
 * on `info.title` and `info.version`, plus a non-conflicting remote change
 * that adds a `servers` entry.
 */
const HARNESS_ROUTE = '/@local/default/test/sync-conflict-editor'

const openHarness = async (page: Page): Promise<void> => {
  // First boot seeds the local workspace and navigates to the default tab,
  // so wait for the shell before loading the harness route directly.
  await page.goto('/', { waitUntil: 'load', timeout: 60_000 })
  await waitForScalarAppShellReady(page)

  await page.goto(HARNESS_ROUTE, { waitUntil: 'load', timeout: 60_000 })
  await waitForScalarAppShellReady(page)
  // Three inline diff editors: local, remote and result
  await expect(page.locator('.monaco-diff-editor')).toHaveCount(3)
  // The code lenses show up once the conflict ranges are resolved
  await expect(page.getByText('Accept Current').first()).toBeVisible({
    timeout: 60_000,
  })
  // The inline diff decorations paint asynchronously; the fixture always
  // produces inserted lines, so wait for them before taking any screenshots
  await expect(page.locator('.monaco-diff-editor .char-insert').first()).toBeVisible()
}

/**
 * Clicks a code lens action and waits for the expected conflict counter.
 *
 * Monaco re-renders the code lens widgets asynchronously after every
 * resolution, so a click right after a previous action can land on a widget
 * that is being swapped out and get lost. Re-applying the same choice is
 * idempotent, so the click is simply retried until the counter updates.
 */
const clickLens = async (page: Page, action: string, position: 'first' | 'last', counter: string): Promise<void> => {
  await expect(async () => {
    await page.getByText(action)[position]().click()
    await expect(page.getByText(counter)).toBeVisible({ timeout: 1_000 })
  }).toPass()
}

/** Blurs the active element so no blinking cursor destabilizes the screenshots. */
const blurActiveElement = async (page: Page): Promise<void> => {
  await page.evaluate(() => {
    const active = document.activeElement
    if (active instanceof HTMLElement) {
      active.blur()
    }
  })
}

test.describe('sync-conflict-editor.e2e', () => {
  /** Monaco spins up several Web Workers; give parallel runs some headroom. */
  test.setTimeout(120_000)

  test('renders the three-way merge editor with conflict decorations', async ({ page }) => {
    await openHarness(page)

    const harness = page.getByTestId('sync-conflict-editor-harness')
    await expect(page.getByText('2 conflicts left')).toBeVisible()
    await expect(harness.locator('.json-focus-highlight-box-single')).toHaveCount(2)

    await blurActiveElement(page)
    await expect(harness).toHaveScreenshot('initial-conflict-state.png', {
      // The overview ruler decorations render with variable timing
      mask: [page.locator('.decorationsOverviewRuler')],
      // Monaco text rendering carries some sub-pixel antialiasing noise
      maxDiffPixelRatio: 0.001,
    })
  })

  test('resolves conflicts via the code lenses and applies the merged document', async ({ page }) => {
    await openHarness(page)

    // Accept the local title and the remote version
    await clickLens(page, 'Accept Current', 'first', '1 conflict left')
    await clickLens(page, 'Accept Remote', 'last', '0 conflicts left')

    await expect(page.getByText('Status: local')).toBeVisible()
    await expect(page.getByText('Status: remote')).toBeVisible()

    const harness = page.getByTestId('sync-conflict-editor-harness')
    await blurActiveElement(page)
    await expect(harness).toHaveScreenshot('resolved-conflict-state.png', {
      // The overview ruler decorations render with variable timing
      mask: [page.locator('.decorationsOverviewRuler')],
      // Monaco text rendering carries some sub-pixel antialiasing noise
      maxDiffPixelRatio: 0.001,
    })

    await page.getByRole('button', { name: 'Apply changes' }).click()

    const payload = page.getByTestId('applied-document')
    await expect(payload).toBeVisible()
    const appliedDocument = JSON.parse((await payload.textContent()) ?? '{}')
    expect(appliedDocument).toEqual({
      openapi: '3.1.0',
      info: {
        title: 'Local Title',
        version: '2.0.0',
        description: 'A sample document with conflicts',
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List pets',
          },
        },
      },
      // The non-conflicting remote change is part of the resolved document
      servers: [{ url: 'https://api.example.com' }],
    })
  })
})
