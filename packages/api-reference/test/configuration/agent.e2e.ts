import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('agent', () => {
  test('shows the Ask AI button by default on localhost', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Ask AI' })).toBeVisible()
  })

  test('hides the Ask AI button when disabled', async ({ page }) => {
    const example = await serveExample({ agent: { disabled: true } })

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Ask AI' })).toHaveCount(0)
  })
})
