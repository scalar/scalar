import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

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
    } while ((await closedTag.count()) > 0)

    const sections = await nav
      .getByRole('listitem')
      .filter({ has: page.getByRole('button', { name: 'Close Group', expanded: true }) })
    await expect(await sections.count()).toBeGreaterThan(0)
    for (const [index, section] of (await sections.all()).entries()) {
      await expect(section).toHaveScreenshot(`${slug}-section-${index + 1}.png`)
    }
  })
})
