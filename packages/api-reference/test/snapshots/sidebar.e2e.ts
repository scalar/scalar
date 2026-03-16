import {
  type Page,
  type PageAssertionsToHaveScreenshotOptions as ScreenshotOptions,
  devices,
  expect,
  test,
} from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

const mobileViewport = devices['iPhone 6'].viewport

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'long-strings']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

/** Options for the page screenshots */
const getScreenshotOptions = (page: Page) =>
  ({
    mask: [page.getByRole('main')], // Hide the main content
    maskColor: '#eee',
  }) satisfies ScreenshotOptions

/**
 * Takes snapshots of the different operation sections
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample(source)
    await page.goto(example)

    const opts = getScreenshotOptions(page)

    // Expand the tag
    const nav = page.getByRole('navigation', { name: 'Sidebar for' })

    await page.goto(`${example}#${slug}/models`)

    // Wait for the sidebar to load
    await expect(nav.getByRole('button', { name: 'Models' })).toBeVisible()
    await expect(page).toHaveScreenshot(`${slug}-sidebar.png`, opts)

    // Open all the sections
    const closedTag = nav.getByRole('button', { name: 'Open Group', expanded: false })
    do {
      await closedTag.first().click()

      // Small delay to allow expansion animation to start
      await page.waitForTimeout(100)
    } while ((await closedTag.count()) > 0)

    // Wait for all expanded sections to be visible and stable
    const sections = nav
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Close Group', expanded: true }) })

    // Wait for sections to appear and be stable
    await expect(sections.first()).toBeVisible({ timeout: 1000 })

    // Playwright's toHaveScreenshot already waits for stability and fonts,
    // but we ensure the DOM is ready by waiting for visibility above
    expect(await sections.count()).toBeGreaterThan(0)

    // Move the mouse and scroll to the top for consistent screenshots
    await page.mouse.move(0, 0)
    await page.evaluate(() => {
      document.documentElement.scrollTop = 0
      const sidebar = document.querySelector('aside > ul.custom-scroll')
      if (sidebar) {
        sidebar.scrollTop = 0
      }
    })

    await expect(page).toHaveScreenshot(`${slug}-sidebar-expanded.png`, opts)
  })
})
/**
 * Takes snapshots of the mobile sidebar
 */
test.describe(() => {
  test.use({ viewport: mobileViewport })
  test.describe.configure({ retries: 3 })
  test('Mobile Sidebar', async ({ page }) => {
    const example = await serveExample(sources[0])
    // Navigate to a specific section so the breadcrumb is consistent
    await page.goto(`${example}#description/introduction`)

    const opts = getScreenshotOptions(page)

    await expect(page).toHaveScreenshot('mobile-sidebar-closed.png', opts)

    await page.getByRole('button', { name: 'Open Menu' }).click()

    await expect(page).toHaveScreenshot('mobile-sidebar-open.png') // We don't need to mask the open sidebar
  })
})

/**
 * Take a snapshot of an extra wide sidebar
 */
test('Custom Sidebar Width', async ({ page }) => {
  const example = await serveExample({
    ...sources[0],
    customCss: ':root { --scalar-sidebar-width: 500px; }',
  })
  const opts = getScreenshotOptions(page)
  await page.goto(example)
  await expect(page).toHaveScreenshot('custom-width.png', opts)
})
