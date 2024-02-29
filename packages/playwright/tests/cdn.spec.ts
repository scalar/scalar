import { expect, test } from '@playwright/test'

test('Renders petstore api reference from CDN', async ({ page, isMobile }) => {
  await page.goto('http://127.0.0.1:3173')

  // Check for basic elements on the page
  // The heading
  await expect(
    page.getByRole('heading', { name: 'Swagger Petstore - OpenAPI' }),
  ).toBeVisible()
  // Body Text
  await expect(
    page.locator('p').filter({ hasText: 'This is a sample Pet Store' }),
  ).toBeVisible()
  // http client
  await expect(page.getByText('Client Libraries')).toBeVisible()

  // Check for elements that are only visible on desktop
  if (!isMobile) {
    // Sidebar
    await expect(
      page.getByRole('link', { name: 'PET', exact: true }),
    ).toBeVisible()
  }
})
