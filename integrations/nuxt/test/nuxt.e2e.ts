import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('renders @scalar/api-reference in a Nuxt page without hydration warnings', async ({ page }) => {
  // Track the known failure from https://github.com/scalar/scalar/issues/4458
  test.fail(true, 'Known issue #4458: @scalar/api-reference fails in Nuxt SSR hydration flow')

  const consoleWarnings: string[] = []
  const pageErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') {
      consoleWarnings.push(message.text())
    }
  })

  page.on('pageerror', (error) => {
    pageErrors.push(error.message)
  })

  const initialResponse = await page.goto('/hydration')
  expect(initialResponse?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: '500' })).toHaveCount(0)

  const reloadResponse = await page.reload()
  expect(reloadResponse?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: '500' })).toHaveCount(0)

  const hydrationWarnings = consoleWarnings.filter((message) => /hydration|mismatch/i.test(message))

  expect(hydrationWarnings).toStrictEqual([])
  expect(pageErrors).toStrictEqual([])
})
