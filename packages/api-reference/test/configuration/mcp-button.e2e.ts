import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('mcpButton', () => {
  // The examples are served from localhost, where the footer pitches Scalar instead of the
  // "Generate MCP" fan-out. That fan-out is only rendered on public hosts now.
  test('shows the Explore Scalar call to action by default on localhost', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Generate SDKs & MCP' })).toBeVisible()
    await expect(page.getByText('Generate MCP')).toBeHidden()
  })

  test('set mcp config', async ({ page }) => {
    const example = await serveExample({
      mcp: {
        name: 'Scalar Galaxy',
        url: 'https://mcp.scalar.com',
      },
    })

    await page.goto(example)

    await expect(page.getByText('Connect MCP')).toBeVisible()
  })

  test('hide mcp config', async ({ page }) => {
    const example = await serveExample({
      mcp: {
        disabled: true,
      },
    })

    await page.goto(example)

    await expect(page.getByRole('link', { name: 'Open API Client' })).toBeVisible()
  })

  test('expands the Explore Scalar card on hover and opens the dialog on click', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    const trigger = page.getByRole('button', { name: 'Generate SDKs & MCP' })
    const card = page.locator('.explore-scalar-card')
    const height = async () => (await card.boundingBox())?.height ?? 0

    const collapsed = await height()

    await trigger.hover()

    // The card grows upward over the navigation, from a 32px bar to a card with the stickers.
    // poll waits out the CSS transition rather than reading a mid-animation frame.
    await expect.poll(async () => (await height()) - collapsed).toBeGreaterThan(100)

    await trigger.click()

    // The dialog root has no box of its own (its panel is fixed), so the panel content is what to look for
    const dialog = page.getByRole('dialog')
    await expect(
      dialog.getByRole('heading', { name: 'Everything your API needs, from one OpenAPI document' }),
    ).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'or get a demo with Marc' })).toBeVisible()

    // Input is ignored while the open morph is still playing, so wait for it to settle first
    await expect(page.locator('html')).not.toHaveAttribute('data-scalar-explore-vt')
    await page.keyboard.press('Escape')

    await expect(dialog).toHaveCount(0)
  })
})
