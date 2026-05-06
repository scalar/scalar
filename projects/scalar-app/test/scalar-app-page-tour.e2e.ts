/**
 * Guided UI snapshots: workspace shell, workspace settings tabs, document collection tabs
 * (via collection settings), document search modal, and example operation tabs.
 *
 * Refresh baselines from `projects/scalar-app`:
 * `CI=1 pnpm exec playwright test test/scalar-app-page-tour.e2e.ts --update-snapshots`
 */
import { type Page, type PageAssertionsToHaveScreenshotOptions, expect, test } from '@playwright/test'

import { waitForOperationEditorPathHighlight } from './helpers/wait-for-operation-editor-path-highlight'
import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

const DOCUMENT_DRAFTS_OVERVIEW = '/@local/default/document/drafts/overview'
const OPERATION_EXAMPLE_DEFAULT = '/@local/default/document/drafts/path/%252F/method/get/example/default'

const viewport = { width: 1280, height: 800 } as const

const shotOptions = {
  animations: 'disabled',
} satisfies PageAssertionsToHaveScreenshotOptions

const waitForFonts = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

const snapshotMain = async (
  page: Page,
  basename: string,
  screenshotOptions?: PageAssertionsToHaveScreenshotOptions,
): Promise<void> => {
  await waitForFonts(page)
  const main = page.locator('main').first()
  await expect(main).toBeVisible({ timeout: 60_000 })
  await expect(main).toHaveScreenshot(`${basename}.png`, { ...shotOptions, ...screenshotOptions })
}

const clickFirstTabLink = async (page: Page, label: string): Promise<void> => {
  await page.getByRole('link', { name: label, exact: true }).first().click()
}

test.describe('scalar-app-page-tour.e2e', () => {
  test.setTimeout(300_000)

  test('workspace, document, search modal, and example operation snapshots', async ({ page }) => {
    await page.setViewportSize(viewport)

    await page.goto('/', { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)

    await page.goto(DOCUMENT_DRAFTS_OVERVIEW, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/document\/drafts\/overview/)

    await page.getByRole('button', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/get-started/)
    await snapshotMain(page, 'workspace-layout-get-started')

    await page.getByRole('button', { name: /Open Menu/i }).click()
    await page.getByRole('menuitem', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/@local\/default\/settings(?:\?|$)/)

    const workspaceTabLabels = ['Environment', 'Cookies', 'Settings'] as const
    const workspaceTabUrls: Record<(typeof workspaceTabLabels)[number], RegExp> = {
      Environment: /\/@local\/default\/environment(?:\?|$)/,
      Cookies: /\/@local\/default\/cookies(?:\?|$)/,
      Settings: /\/@local\/default\/settings(?:\?|$)/,
    }

    for (const label of workspaceTabLabels) {
      await clickFirstTabLink(page, label)
      await expect(page).toHaveURL(workspaceTabUrls[label])
      await snapshotMain(page, `workspace-tab-${label.toLowerCase()}`)
    }

    await page.goto(DOCUMENT_DRAFTS_OVERVIEW, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/document\/drafts\/overview/)

    await page.getByRole('button', { name: 'Collection settings' }).click()
    await expect(page).toHaveURL(/\/document\/drafts\/settings/)

    const documentTabs = [
      'Overview',
      'Servers',
      'Authentication',
      'Environment',
      'Cookies',
      'Scripts',
      'Runner',
      'Settings',
    ] as const

    const documentTabUrl: Record<(typeof documentTabs)[number], RegExp> = {
      Overview: /\/document\/drafts\/overview(?:\?|$)/,
      Servers: /\/document\/drafts\/servers(?:\?|$)/,
      Authentication: /\/document\/drafts\/authentication(?:\?|$)/,
      Environment: /\/document\/drafts\/environment(?:\?|$)/,
      Cookies: /\/document\/drafts\/cookies(?:\?|$)/,
      Scripts: /\/document\/drafts\/scripts(?:\?|$)/,
      Runner: /\/document\/drafts\/runner(?:\?|$)/,
      Settings: /\/document\/drafts\/settings(?:\?|$)/,
    }

    for (const label of documentTabs) {
      await clickFirstTabLink(page, label)
      await expect(page).toHaveURL(documentTabUrl[label])
      await snapshotMain(page, `document-tab-${label.toLowerCase()}`)
    }

    await page.getByRole('button', { name: 'Search collection' }).click()
    // `role="dialog"` is visible to a11y before ScalarModal fade-in finishes; the panel is reliable.
    const searchPanel = page.locator('.scalar-modal-search').first()
    await expect(searchPanel).toBeVisible({ timeout: 15_000 })
    await waitForFonts(page)
    await expect(searchPanel).toHaveScreenshot('document-search-modal.png', shotOptions)
    await page.keyboard.press('Escape')
    await expect(searchPanel).toBeHidden({ timeout: 15_000 })

    await page.goto(OPERATION_EXAMPLE_DEFAULT, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/example\/default/)

    await page.getByRole('button', { name: 'Operation settings' }).click()
    await expect(page).toHaveURL(/\/method\/get\/overview/)

    const operationTabs = ['Overview', 'Servers', 'Authentication', 'Editor'] as const
    const operationTabUrl: Record<(typeof operationTabs)[number], RegExp> = {
      Overview: /\/method\/get\/overview(?:\?|$)/,
      Servers: /\/method\/get\/servers(?:\?|$)/,
      Authentication: /\/method\/get\/authentication(?:\?|$)/,
      Editor: /\/method\/get\/editor(?:\?|$)/,
    }

    for (const label of operationTabs) {
      await clickFirstTabLink(page, label)
      await expect(page).toHaveURL(operationTabUrl[label])
      if (label === 'Editor') {
        await page.locator('.monaco-editor').first().waitFor({ state: 'visible', timeout: 60_000 })
        await waitForOperationEditorPathHighlight(page)
      }
      await snapshotMain(page, `operation-tab-${label.toLowerCase()}`)
    }
  })
})
