import { type Page, expect } from '@playwright/test'

/**
 * Test the play button
 */
export async function testPlayButton(page: Page) {
  // Wait
  await page.waitForTimeout(500)
  // Button has scalar-operation-id="getAllData"
  await page.waitForSelector('button[scalar-operation-id="getAllData"]')
  // Click button
  await page.click('text=Try it Out')

  // Wait until a button with text="Send Request" is visible
  await page.waitForSelector('.scalar-client')

  // URL
  await expect(page.getByRole('button', { name: 'Server: https://galaxy.scalar.com' })).toBeVisible()
  // Path
  await expect(page.getByText('/planets', { exact: true })).toBeVisible()
}
