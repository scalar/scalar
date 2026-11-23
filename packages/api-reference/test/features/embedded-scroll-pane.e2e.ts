import { type Page, expect, test } from '@playwright/test'

/** A page with content below the pane can scroll independently of the reference. */
const addScrollableHost = async (page: Page): Promise<void> => {
  await page.route('**/scroll-pane.html*', async (route) => {
    const response = await route.fetch()
    const html = (await response.text()).replace(
      '</body>',
      '<footer style="position:absolute;top:100vh;height:500px">Host footer</footer></body>',
    )
    await route.fulfill({ response, body: html })
  })
}

test.describe('embedded-scroll-pane', () => {
  test('fits the desktop sidebar to the pane as the browser resizes', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/scroll-pane.html?document=short')

    const pane = page.getByRole('group', { name: 'API Reference scroll pane' })
    const sidebar = pane.getByRole('complementary', { name: /sidebar/i })
    await expect(sidebar).toBeVisible()

    for (const height of [800, 560]) {
      await page.setViewportSize({ width: 1280, height })
      await expect
        .poll(async () => {
          const paneBox = await pane.boundingBox()
          const sidebarBox = await sidebar.boundingBox()
          return paneBox && sidebarBox && Math.round(sidebarBox.height - paneBox.height)
        })
        .toBe(0)
      await expect.poll(() => pane.evaluate((element) => element.scrollHeight - element.clientHeight)).toBe(0)
    }
  })

  test('tracks the active operation while scrolling a pane above the viewport midpoint', async ({
    page,
  }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await addScrollableHost(page)
    await page.goto('/scroll-pane.html?scroll=short')

    const pane = page.getByRole('group', { name: 'API Reference scroll pane' })
    const third = pane.getByRole('link', { name: /^Read project 3\b/ })
    const fourth = pane.getByRole('link', { name: /^Read project 4\b/ })
    await third.click()
    await expect(third).toHaveAttribute('aria-current', 'page')

    const paneBox = (await pane.boundingBox())!
    const fourthSection = pane.locator('section[id$="/GET/projects/4"]')
    await expect(fourthSection).toBeAttached()
    const fourthBox = (await fourthSection.boundingBox())!
    await page.mouse.move(paneBox.x + paneBox.width * 0.75, paneBox.y + paneBox.height / 2)
    await page.mouse.wheel(0, Math.round(fourthBox.y - paneBox.y))

    await expect(fourth).toHaveAttribute('aria-current', 'page')
    await expect(page).toHaveURL(/#tag\/projects\/GET\/projects\/4$/)
    await expect(page).toHaveTitle('Read project 4 · Developer portal')
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
  })

  test('keeps the mobile menu and keyboard-selected operation inside the pane', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 320, height: 800 })
    await addScrollableHost(page)
    await page.goto('/scroll-pane.html')

    const pane = page.getByRole('group', { name: 'API Reference scroll pane' })
    const openMenu = pane.getByRole('button', { name: 'Open Menu' })
    await expect(openMenu).toBeVisible()
    await openMenu.focus()
    await page.keyboard.press('Enter')

    const closeMenu = pane.getByRole('button', { name: 'Close Menu' })
    await expect(closeMenu).toBeInViewport()
    const operation = pane.getByRole('link', { name: /^Read project 3\b/ })
    await operation.focus()
    await page.keyboard.press('Enter')

    await expect(openMenu).toBeVisible()
    const target = pane.locator('section[id$="/GET/projects/3"]')
    await expect(target).toBeFocused()
    await expect
      .poll(async () => {
        const header = await page.locator('.preview-header').boundingBox()
        const section = await target.boundingBox()
        return header && section && Math.round(section.y - header.y - header.height)
      })
      .toBeGreaterThanOrEqual(50)
    await expect(page).toHaveURL(/#tag\/projects\/GET\/projects\/3$/)
    expect(await page.evaluate(() => [window.scrollY, document.documentElement.scrollWidth])).toStrictEqual([0, 320])
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeGreaterThan(0)
  })

  test('opens a classic deep link at the pane edge below the host header', async ({ page }): Promise<void> => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await addScrollableHost(page)
    await page.goto('/scroll-pane.html?scroll=short&layout=classic#tag/projects/GET/projects/4')

    const pane = page.getByRole('group', { name: 'API Reference scroll pane' })
    const operation = pane.locator('section[id$="/GET/projects/4"]')
    await expect
      .poll(async () => {
        const paneBox = await pane.boundingBox()
        const sectionBox = await operation.boundingBox()
        return paneBox && sectionBox ? Math.abs(sectionBox.y - paneBox.y) : Number.POSITIVE_INFINITY
      })
      .toBeLessThan(1)
    expect(await page.evaluate(() => window.scrollY)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollHeight - innerHeight)).toBeGreaterThan(0)
  })
})
