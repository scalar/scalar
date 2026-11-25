import { expect, test } from '@test/helpers'

test.describe('ScalarDialog', () => {
  test.use({ story: 'With Tooltip' })

  test('hides an open tooltip on Escape before it closes the dialog', async ({ page }) => {
    const dialog = page.getByRole('dialog', { name: 'Dialog with a tooltip' })
    const tooltip = page.getByRole('tooltip')
    await expect(dialog).toBeVisible()

    await page.getByRole('button', { name: 'Hover Me' }).hover()
    await expect(tooltip).toBeVisible()

    // The first press belongs to the tooltip, which must not let the dialog see a cancel request
    await page.keyboard.press('Escape')
    await expect(tooltip).toBeHidden()
    await expect(dialog).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })
})
