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
    await expect(page.getByText('Dark', { exact: true })).toHaveCSS('background-color', 'rgb(0, 0, 0)')
    await expect(page.getByText('Plain', { exact: true })).not.toHaveCSS('background-color', 'rgb(255, 204, 0)')
  })
})
