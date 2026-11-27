import type { Locator } from '@playwright/test'
import { expect, test } from '@test/helpers'

test.describe('SpecificationExtensions', () => {
  test.use({ story: 'Compact' })

  test('opens and closes the disclosure from the keyboard', async ({ page }) => {
    const plain = page.getByRole('region', { name: 'Plain extensions' })
    const folded = page.getByRole('region', { name: 'Folded extensions' })
    const toggle = folded.getByRole('button', { name: 'Extensions (2)', exact: true })
    const collection = folded.getByRole('button', { name: 'x-cost', exact: true })

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(collection).toHaveCount(0)

    await plain.getByRole('button', { name: 'x-cost', exact: true }).focus()
    await page.keyboard.press('Tab')
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(collection).toHaveAttribute('aria-expanded', 'true')

    await page.keyboard.press('Tab')
    await expect(collection).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(toggle).toBeFocused()
    await page.keyboard.press('Space')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(collection).toHaveCount(0)
  })

  test('keeps the relative alignment of compact rows inside the fold', async ({ page }) => {
    const plain = page.getByRole('region', { name: 'Plain extensions' })
    const folded = page.getByRole('region', { name: 'Folded extensions' })
    await folded.getByRole('button', { name: 'Extensions (2)', exact: true }).click()

    const labelOffset = async (region: Locator): Promise<number> => {
      const primitive = await region
        .getByText('x-owner:', { exact: true })
        .evaluate((label) => label.getBoundingClientRect().x)
      const collection = await region
        .getByText('x-cost', { exact: true })
        .evaluate((label) => label.getBoundingClientRect().x)
      return collection - primitive
    }

    const plainOffset = await labelOffset(plain)
    expect(plainOffset).toBeGreaterThan(0)
    expect(await labelOffset(folded)).toBe(plainOffset)
  })
})

test.describe('SpecificationExtensions label', () => {
  test.use({ component: 'SpecificationExtensions', story: 'Long Label', viewport: { width: 320, height: 480 } })

  test('wraps a long localized label in a narrow viewport', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /^Vertragserweiterungsinformationen.*\(1\)$/ })
    await expect(toggle).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  })
})
