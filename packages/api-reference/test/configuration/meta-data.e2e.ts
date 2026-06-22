import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('metaData', () => {
  test('sets the document title and meta tags', async ({ page }) => {
    const example = await serveExample({
      metaData: {
        title: 'My Page Title',
        description: 'My page description',
        ogTitle: 'My OG Title',
        ogDescription: 'My OG description',
        ogImage: 'https://example.com/image.png',
        twitterCard: 'summary_large_image',
      },
    })

    await page.goto(example)

    await expect(page).toHaveTitle('My Page Title')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', 'My page description')
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', 'My OG Title')
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://example.com/image.png')
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
  })
})
