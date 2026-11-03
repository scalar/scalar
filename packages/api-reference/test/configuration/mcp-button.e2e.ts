import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('mcpButton', () => {
  // The examples are served from localhost, where the developer toolbar offers Generate SDK and the
  // sidebar footer stays empty: no call to action, no "Generate MCP" fan-out, no API client button
  test('keeps the sidebar footer empty on localhost and offers Generate SDK in the toolbar', async ({ page }) => {
    const example = await serveExample({ showDeveloperTools: 'localhost' })

    await page.goto(example)

    await expect(
      page.getByRole('region', { name: 'Developer Tools' }).getByRole('button', { name: 'Generate SDK' }),
    ).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate SDKs & MCP' })).toHaveCount(0)
    await expect(page.getByText('Generate MCP')).toBeHidden()
    await expect(page.getByRole('link', { name: 'Open API Client' })).toHaveCount(0)
  })

  test('hides SDK generation and the local promotion when developer tools are disabled', async ({ page }) => {
    const example = await serveExample({ showDeveloperTools: 'never', hideClientButton: true })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Generate SDKs & MCP' })).toHaveCount(0)
    await expect(page.locator('.generate-sdk-button')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Open API Client' })).toHaveCount(0)
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

  test('opens Generate SDK in the side panel beside the reference', async ({ page }) => {
    const example = await serveExample({ showDeveloperTools: 'localhost' })

    await page.goto(example)

    const toolbar = page.getByRole('region', { name: 'Developer Tools' })
    const trigger = toolbar.getByRole('button', { name: 'Generate SDK' })
    await trigger.click()

    const panel = page.getByRole('complementary', { name: 'Generate SDK' })
    await expect(
      panel.getByRole('heading', { name: 'Everything your API needs, from one OpenAPI document' }),
    ).toBeVisible()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await panel.getByRole('button', { name: 'or get a demo with Marc' }).focus()
    await page.keyboard.press('Escape')

    await expect(panel).toHaveCount(0)
    await expect(trigger).toBeFocused()
  })
})
