import { expect, test } from '@test/helpers'

test.describe('Badge', () => {
  test.use({ story: 'Colors' })

  test('keeps explicit colors above the themed utility defaults', async ({ page }) => {
    // Consumers can load their themed utilities after the component styles.
    await page.addStyleTag({
      content:
        '.scalar-app .bg-b-2 { background-color: var(--scalar-background-2); } .scalar-app .text-c-2 { color: var(--scalar-color-2); }',
    })
    await expect(page.getByText('Gamma', { exact: true })).toHaveCSS('background-color', 'rgb(255, 204, 0)')
    await expect(page.getByText('Gamma', { exact: true })).toHaveCSS('color', 'lch(0 0 0)')
    await expect(page.getByText('Dark', { exact: true })).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(page.getByText('Dark', { exact: true })).toHaveCSS('color', 'lch(100 0 0)')
    await expect(page.getByText('Plain', { exact: true })).not.toHaveCSS('background-color', 'rgb(255, 204, 0)')
  })

  test('restores themed colors when the explicit color is removed', async ({ page }) => {
    const badge = page.getByText('Gamma', { exact: true })
    const plain = page.getByText('Plain', { exact: true })
    const themedColors = await plain.evaluate((element) => {
      const { backgroundColor, color } = getComputedStyle(element)
      return { backgroundColor, color }
    })

    await expect(badge).toHaveCSS('background-color', 'rgb(255, 204, 0)')
    await expect(badge).toHaveCSS('color', 'lch(0 0 0)')

    await page.getByRole('button', { name: 'Use black', exact: true }).click()
    await expect(badge).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(badge).toHaveCSS('color', 'lch(100 0 0)')

    await page.getByRole('button', { name: 'Use theme color', exact: true }).click()
    await expect(badge).toHaveCSS('background-color', themedColors.backgroundColor)
    await expect(badge).toHaveCSS('color', themedColors.color)
  })
})
