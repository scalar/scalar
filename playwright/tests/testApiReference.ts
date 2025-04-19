import { type Page, expect } from '@playwright/test'

/**
 * Test the @scalar/api-reference page
 */
export async function testApiReference(page: Page, isMobile: boolean) {
  // The heading
  await expect(page.getByRole('heading', { name: 'Scalar Galaxy' })).toBeVisible()
  // Body Text
  await expect(page.getByText('The Scalar Galaxy')).toBeVisible()
  // http client
  await expect(page.getByText('Client Libraries')).toBeVisible()

  if (isMobile) {
    // Check for the menu button
    await expect(page.getByRole('button', { name: 'Open Menu' })).toBeVisible()
    // Open the mobile menu
    await page.getByRole('button', { name: 'Open Menu' }).click()
  }

  // Sidebar link
  await expect(page.getByRole('link', { name: 'Planets', exact: true })).toBeVisible()
}

/**
 * Test the hello world page
 */
export async function testHelloWorld(page: Page) {
  // The heading
  await expect(page.getByRole('heading', { name: 'Hello World' })).toBeVisible()
  // http client
  await expect(page.getByText('Client Libraries')).toBeVisible()
}
