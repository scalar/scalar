import { type Page, expect } from '@playwright/test'

// Check for basic elements on the scalar api reference page
export async function apiReference(page: Page, isMobile: boolean) {
  // The heading
  await expect(
    page.getByRole('heading', { name: 'Scalar Galaxy' }),
  ).toBeVisible()
  // Body Text
  await expect(page.getByText('The Scalar Galaxy')).toBeVisible()
  // http client
  await expect(page.getByText('Client Libraries')).toBeVisible()

  // Check for elements that are only visible on desktop
  if (!isMobile) {
    // Sidebar
    await expect(
      page.getByRole('link', { name: 'Planets', exact: true }),
    ).toBeVisible()
  }
}
