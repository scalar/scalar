import { expect, test } from '@playwright/test'

for (const path of ['/scalar', '/embedded']) {
  test(`explores the local API at ${path}`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(path)
    await expect(page.getByRole('heading', { name: 'Orbit API', exact: true })).toBeVisible()
    if (path === '/embedded') {
      await expect(page).toHaveTitle('Orbit API | Embedded reference')
      const toggle = page.getByRole('button', { name: 'Dark mode', exact: true })
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'true')
      await toggle.click()
      await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    }
    await page.getByRole('button', { name: /Test Request/ }).click()
    const pending = page.waitForResponse(
      (response) => response.url().endsWith('/api/planets') && response.status() === 200,
    )
    await page.getByRole('button', { name: /^Send get request/ }).click()
    expect(await (await pending).json()).toStrictEqual([
      { id: 'earth', name: 'Earth', moons: 1 },
      { id: 'mars', name: 'Mars', moons: 2 },
    ])
    expect(errors).toStrictEqual([])
  })
}
