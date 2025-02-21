import { expect, test } from '@playwright/test'

const HOST = process.env.HOST || 'localhost'

test('Renders scalar/galaxy api reference from nuxt', async ({ page, isMobile }) => {
  await page.goto(`http://${HOST}:5062/json`)

  // Check for basic elements on the page
  // The heading
  await expect(page.getByRole('heading', { name: 'Scalar Galaxy' })).toBeVisible()
  // Body Text
  await expect(page.getByText('The Scalar Galaxy')).toBeVisible()
  // http client
  await expect(page.getByText('Client Libraries')).toBeVisible()

  // Check for elements that are only visible on desktop
  if (!isMobile) {
    // Sidebar
    await expect(page.getByRole('link', { name: 'PLANETS', exact: true })).toBeVisible()
  }
})
