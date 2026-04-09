import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('Content page at /docs-reference is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/docs-reference')

  await expect(page.getByRole('heading', { name: 'API Reference Documentation' })).toBeVisible()
  await expect(page.getByText('This is a content page, not the Scalar viewer.')).toBeVisible()
})

test('Content page at /docs-keys is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/docs-keys')

  await expect(page.getByRole('heading', { name: 'API Keys Management' })).toBeVisible()
  await expect(page.getByText('This is a content page for managing API keys.')).toBeVisible()
})
