import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/** Minimal document that renders the `x-scalar-links` extension in the introduction */
const content = {
  openapi: '3.1.0',
  info: {
    title: 'Scalar Galaxy',
    version: '1.0.0',
    'x-scalar-links': [
      { name: 'Privacy Policy', url: 'https://example.com/privacy' },
      { name: 'Imprint', url: 'https://example.com/imprint' },
    ],
  },
  paths: {},
}

/**
 * Takes a snapshot of the `x-scalar-links` legal links rendered next to the other
 * info links in the introduction.
 */
test('x-scalar-links', async ({ page }) => {
  const example = await serveExample({ content })
  await page.goto(example)

  // The link list that wraps the info links (contact, license, terms, x-scalar-links)
  const links = page.locator('div.custom-scroll', {
    has: page.getByRole('link', { name: 'Imprint' }),
  })

  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toBeVisible()
  await expect(links).toHaveScreenshot('x-scalar-links.png')
})
