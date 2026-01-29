import { devices, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

const mobileViewport = devices['iPhone 6'].viewport

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'long-strings']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

/**
 * Takes snapshots of the different operation sections
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample(source)
    await page.goto(example)

    // Expand the tag
    const nav = page.getByRole('navigation', { name: 'Sidebar for' })

    // Wait for the sidebar to load
    await expect(nav.getByRole('button', { name: 'Models' })).toBeVisible()
    await expect(nav).toHaveScreenshot(`${slug}-sidebar.png`)

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

    // TODO: This test fails in CI/CD. Need to investigate why.
    // Error: Expected an image 526px by 264px, received 526px by 262px. 2894 pixels (ratio 0.03 of all image pixels) are different.
    // for (const [index, section] of (await sections.all()).entries()) {
    //   await expect(section).toHaveScreenshot(`${slug}-section-${index + 1}.png`)
    // }
  })
})

/**
 * Takes snapshots of the mobile sidebar
 */

test('Mobile Sidebar', async ({ page }) => {
  const example = await serveExample(sources[0])
  await page.goto(example)
  await page.setViewportSize(mobileViewport)

  await expect(page).toHaveScreenshot('mobile-sidebar-closed.png')

  await page.getByRole('button', { name: 'Open Menu' }).click()

  await expect(page).toHaveScreenshot('mobile-sidebar-open.png')
})

/**
 * Take a snapshot of an extra wide sidebar
 */
test('Custom Sidebar Width', async ({ page }) => {
  const example = await serveExample({
    ...sources[0],
    customCss: ':root { --scalar-sidebar-width: 500px; }',
  })
  await page.goto(example)
  await expect(page).toHaveScreenshot('custom-width.png')
})
