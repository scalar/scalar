import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/** Minimal document with a contact that has both an email and a url */
const content = {
  openapi: '3.1.0',
  info: {
    title: 'Scalar Galaxy',
    version: '1.0.0',
    contact: {
      name: 'Scalar Support',
      email: 'support@example.com',
      url: 'https://example.com/support',
    },
  },
  paths: {},
}

/**
 * Takes a snapshot of the contact links in the introduction. The email and url links
 * each get their own wrapper, so a divider renders between them like the other info links.
 */
test('contact-links', async ({ page }) => {
  const example = await serveExample({ content })
  await page.goto(example)

  // The link list that wraps the info links
  const links = page.locator('div.custom-scroll', {
    has: page.getByRole('link', { name: 'Scalar Support' }),
  })

  await expect(page.getByRole('link', { name: 'Scalar Support' })).toBeVisible()
  await expect(links).toHaveScreenshot('contact-links.png')
})
