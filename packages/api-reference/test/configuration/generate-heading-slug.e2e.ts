import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: {
    title: 'Test API',
    version: '1.0.0',
    // A level-2 sub-heading becomes a description heading node
    description: 'Some introduction text.\n\n## Overview\n\nMore details here.',
  },
  paths: {},
}

test.describe('generateHeadingSlug', () => {
  test('uses the custom heading slug for the section id', async ({ page }) => {
    const example = await serveExample({
      generateHeadingSlug: (heading: { slug?: string }) => `#custom-section/${heading.slug}`,
      content,
    })

    await page.goto(example)

    // The custom slug becomes the heading section id (the click URL still uses
    // the plain anchor, so we assert on the generated id instead)
    await expect(page.locator('[id="#custom-section/overview"]').first()).toBeAttached()
  })
})
