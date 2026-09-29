import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

test.describe('section focus', () => {
  for (const navigation of ['pointer', 'keyboard']) {
    test(`focuses an operation without outlining the section after ${navigation} navigation`, async ({ page }) => {
      const example = await serveExample(sources[0])
      await page.goto(example)

      const sidebar = page.getByRole('complementary', { name: 'Sidebar for' })
      const link = sidebar.getByRole('link', { name: 'Create a user HTTP Method: POST', exact: true })
      if (navigation === 'pointer') {
        await link.click()
      } else {
        await link.focus()
        await page.keyboard.press('Enter')
      }

      const section = page.getByRole('region', { name: 'Create a user', exact: true })
      await expect(section).toBeFocused()
      await expect(section).toHaveCSS('outline-style', 'none')

      // Suppressing the section outline must not hide focus on its controls.
      await page.keyboard.press('Tab')
      const focusedControl = section.locator(':focus')
      await expect(focusedControl).toBeFocused()
      await expect(focusedControl).toHaveCSS('outline-style', 'solid')
    })
  }
})
