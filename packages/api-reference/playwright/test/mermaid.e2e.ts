import { expect, test } from '@playwright/test'

test('hides complete diagrams in summaries and restores interactive controls when expanded', async ({ page }) => {
  await page.goto('/playground/mermaid/summary.html')
  const diagram = page.getByRole('region', { name: 'Mermaid diagram', includeHidden: true })
  await expect(diagram.locator('svg')).toBeAttached()
  await expect(diagram).toBeHidden()
  await expect(page.getByRole('button', { name: 'Zoom in' })).toBeHidden()
  await page.getByRole('button', { name: 'More', exact: true }).click()
  await expect(diagram).toBeVisible()
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(diagram.locator('svg').locator('..')).toHaveCSS('transform', 'matrix(1.25, 0, 0, 1.25, 0, 0)')
  await page.getByRole('button', { name: 'Show Less', exact: true }).click()
  await expect(diagram).toBeHidden()
})

test('keeps Mermaid fences as code without requesting the plugin or renderer when disabled', async ({ page }) => {
  const diagramRequests: string[] = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.includes('/mermaid-plugin/') || /(?:node_modules|deps)\/.*mermaid/i.test(path)) {
      diagramRequests.push(request.url())
    }
  })
  await page.goto('/playground/mermaid/index.html?withoutPlugin')
  const fence = page.locator('pre > code.language-mermaid').first()
  await expect(fence).toBeVisible()
  await expect(fence).toContainText('Request --> Authentication')
  await expect(page.getByRole('region', { name: 'Mermaid diagram' })).toHaveCount(0)
  // Wait for initial rendering and its asynchronous Markdown hooks to settle.
  await page.waitForLoadState('networkidle')
  expect(diagramRequests).toEqual([])
})
