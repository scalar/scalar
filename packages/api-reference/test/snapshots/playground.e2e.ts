import { expect, test } from '@playwright/test'

// Exercise the actual playground HTML, including Vite's deep-link fallback.
test.describe('playground', (): void => {
  test.describe.configure({ timeout: 120_000 })
  test.use({ actionTimeout: 15_000 })
  test('embedded documentation', async ({ page }): Promise<void> => {
    await page.goto('/embedded.html')
    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Developer portal' })).toBeVisible()
    await expect(page).toHaveScreenshot('embedded.png')
    await page.getByText('Developer portal · API documentation', { exact: true }).scrollIntoViewIfNeeded()
    await expect(page.getByText('Developer portal · API documentation', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Developer portal' })).toBeInViewport()
    await expect(page).toHaveScreenshot('embedded-footer.png')
  })

  test('path routing survives a deep-link reload', async ({ page }): Promise<void> => {
    await page.goto('/path-routing')
    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Planets', exact: true }).click()
    await expect(page).toHaveURL(/\/path-routing\/tag\/planets$/)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Planets', exact: true })).toBeInViewport()
    await expect(page).toHaveScreenshot('path-routing.png')
  })

  for (const layout of ['modern', 'classic']) {
    for (const darkMode of [false, true]) {
      test(`${layout} theme preview in ${darkMode ? 'dark' : 'light'} mode`, async ({ page }): Promise<void> => {
        await page.goto(`/layout-theme.html?layout=${layout}&theme=purple&darkMode=${darkMode}`)
        await expect(page.getByRole('heading', { name: 'Scalar Galaxy', exact: true })).toBeVisible()
        await expect(page).toHaveScreenshot(`theme-${layout}-${darkMode ? 'dark' : 'light'}.png`)
      })
    }
  }
})
