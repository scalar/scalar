import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: {
    title: 'Test API',
    version: '1.0.0',
    // A level-2 sub-heading becomes a description heading entry in the sidebar
    description: 'Some introduction text.\n\n## Overview\n\nMore details here.',
  },
  paths: {},
}

/** Expand the (collapsed) Introduction group and click the description heading. */
const clickOverviewHeading = async (page: import('@playwright/test').Page) => {
  await page.getByRole('navigation').getByRole('button', { name: 'Open Introduction' }).click()
  await page.getByRole('navigation').getByRole('button', { name: 'Overview', exact: true }).click()
}

test.describe('generateHeadingSlug', () => {
  test('uses the default description hash when not configured', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await clickOverviewHeading(page)

    await expect(page).toHaveURL(/#description\/overview/)
  })

  test('navigates to the custom heading slug', async ({ page }) => {
    const example = await serveExample({
      // The custom value is a bare slug segment; `description/` is prepended automatically
      generateHeadingSlug: (heading: { slug?: string }) => `custom-${heading.slug}`,
      content,
    })

    await page.goto(example)

    await clickOverviewHeading(page)

    await expect(page).toHaveURL(/#description\/custom-overview/)
  })
})
