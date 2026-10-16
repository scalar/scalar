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
  `)
  for (const path of ['../api-client/dist/style.css', 'dist/style.css']) {
    await page.addStyleTag({ path: join(packageRoot, path) })
  }
  const body = page.locator('body')
  await expect(body).toHaveCSS('background-color', 'rgb(12, 24, 36)')
  await expect(body).toHaveCSS('margin', '13px')
  await expect(body).toHaveCSS('line-height', '32px')

  await page.screenshot({ path: testInfo.outputPath('layered-host-background.png'), animations: 'disabled' })

  // Nuxt retains the imported component CSS when changing routes without a full reload.
  await page.locator('main').evaluate((el) => {
    el.textContent = 'Another host route with Scalar styles still loaded'
  })
  await expect(body).toHaveCSS('background-color', 'rgb(12, 24, 36)')
  await expect(body).toHaveCSS('margin', '13px')
})

test('standalone pages retain their background and margin reset', async ({ page }) => {
  await page.setContent('<body class="dark-mode"></body>')
  await page.addScriptTag({ path: join(packageRoot, 'dist/browser/standalone.js') })
  await expect(page.locator('body')).toHaveCSS('margin', '0px')
  const background = await page.locator('body').evaluate((el) => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--scalar-background-1)'
    el.append(probe)
    const color = getComputedStyle(probe).backgroundColor
    probe.remove()
    return color
  })
  expect(background).not.toBe('rgba(0, 0, 0, 0)')
  await expect(page.locator('body')).toHaveCSS('background-color', background)
})
