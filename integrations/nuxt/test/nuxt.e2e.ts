import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/developer/api')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('Scalar route matches exact base path', async ({ page }) => {
  await page.goto('/developer/api')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('Scalar route matches sub-paths with slash separator', async ({ page }) => {
  await page.goto('/developer/api/pets')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('Content page at /developer/api-reference is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/developer/api-reference')

  await expect(page.getByRole('heading', { name: 'API Reference Documentation' })).toBeVisible()
  await expect(page.getByText('This is a content page, not the Scalar viewer.')).toBeVisible()
})

test('Content page at /developer/api-keys is not hijacked by Scalar', async ({ page }) => {
  await page.goto('/developer/api-keys')

  await expect(page.getByRole('heading', { name: 'API Keys Management' })).toBeVisible()
  await expect(page.getByText('This is a content page for managing API keys.')).toBeVisible()
})
