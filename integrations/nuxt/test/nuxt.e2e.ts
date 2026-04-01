import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})

test('renders @scalar/api-reference in a Nuxt page without hydration warnings', async ({ page }) => {
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

  await page.goto('/hydration')
  await expect(page.getByText('Nuxt Hydration Test API')).toBeVisible()

  await page.reload()
  await expect(page.getByText('Nuxt Hydration Test API')).toBeVisible()

  const hydrationWarnings = consoleWarnings.filter((message) =>
    /hydration|mismatch/i.test(message),
  )

  expect(hydrationWarnings).toStrictEqual([])
  expect(pageErrors).toStrictEqual([])
})
