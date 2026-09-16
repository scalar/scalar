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
