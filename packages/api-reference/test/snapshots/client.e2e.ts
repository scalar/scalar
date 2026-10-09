import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

/**
 * Takes snapshots of the client modal
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample(source)
    await page.goto(`${example}#tag/authentication/POST/user/signup`)

    await page.getByText('Test Request').first().click()

    const dialog = page.getByRole('dialog', { name: 'API Client' })
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('button', { name: 'Close Client', exact: true })).toBeVisible()

    // The documentation behind the modal can still scroll while lazy sections settle.
    await expect(dialog).toHaveScreenshot(`${slug}.png`)
  })
})
