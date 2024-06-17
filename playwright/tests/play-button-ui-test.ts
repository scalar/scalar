import { type Page, expect } from '@playwright/test'

// Check for basic elements
export async function playButton(page: Page, isMobile: boolean) {
  // Click button
  await page.click('text=Try it Out')

  // TODO: Write test :)
}
