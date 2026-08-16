import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('mcpButton', () => {
  test('shows mcp button by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByText('Generate MCP')).toBeVisible()
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

  test('fans the entries out on hover with no mcp config', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    // Without a config the entries render as <button>, so the fan-out has to
    // move them up on hover instead of leaving an empty popup.
    const vscode = page.getByRole('button', { name: 'VS Code' })
    const top = async () => (await vscode.boundingBox())?.y ?? 0

    const collapsed = await top()

    await page.locator('.scalar-mcp-layer').hover()

    // poll waits out the CSS transition rather than reading a mid-animation frame
    await expect.poll(async () => collapsed - (await top())).toBeGreaterThan(40)
  })
})
