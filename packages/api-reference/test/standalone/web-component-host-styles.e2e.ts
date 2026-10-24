import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const packageRoot = join(import.meta.dirname, '../..')

test.beforeEach(async ({ page }) => {
  await page.route('https://host.example.test/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  )
  await page.goto('https://host.example.test/')
})

/** Exercise the stylesheet imports used by Nuxt even on routes without a reference. */
test('component styles preserve a layered host body across route changes', async ({ page }, testInfo) => {
  await page.setContent(`
    <style>@layer base { body { background-color: rgb(12, 24, 36); color: white; margin: 13px; line-height: 2; } }</style>
    <main>Host route with its own layered background</main>
    <scalar-api-reference></scalar-api-reference>
  `)
  for (const path of ['../api-client/dist/style.css', 'dist/style.css']) {
    await page.addStyleTag({ path: join(packageRoot, path) })
  }
  const body = page.locator('body')
  await expect(body).toHaveCSS('background-color', 'rgb(12, 24, 36)')
  await expect(body).toHaveCSS('margin', '13px')
  await expect(body).toHaveCSS('line-height', '32px')

  await page.evaluate(() => {
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Embedded API', version: '1.0.0' }, paths: {} },
        darkMode: true,
        showDeveloperTools: 'never',
      },
    })
  })
  await page.addScriptTag({ path: join(packageRoot, 'dist/webComponent/component.js') })
  await expect(page.getByRole('heading', { name: 'Embedded API', exact: true })).toBeVisible()
  await expect(body).toHaveCSS('background-color', 'rgb(12, 24, 36)')
  await expect(body).toHaveCSS('margin', '13px')
  await page.screenshot({ path: testInfo.outputPath('layered-host-background.png'), animations: 'disabled' })
  await page.locator('scalar-api-reference').evaluate((el) => el.remove())

  // Nuxt retains the imported component CSS when changing routes without a full reload.
  await page.locator('main').evaluate((el) => {
    el.textContent = 'Another host route with Scalar styles still loaded'
  })
  await expect(body).toHaveCSS('background-color', 'rgb(12, 24, 36)')
  await expect(body).toHaveCSS('margin', '13px')
})
