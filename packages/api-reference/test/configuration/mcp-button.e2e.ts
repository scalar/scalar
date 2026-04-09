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
})
