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

/** The mode class lands on the host page's body, but its color scheme should stay on Scalar elements. */
test('the color mode does not change the host page color scheme', async ({ page }) => {
  await page.setContent(`
    <body class="dark-mode">
      <main>Host content <input /></main>
      <div class="scalar-app">
        Reference <input />
        <div class="light-mode">Light block inside a dark reference</div>
      </div>
    </body>
  `)
  await page.addStyleTag({ path: join(packageRoot, 'dist/style.css') })

  await expect(page.locator('body')).toHaveCSS('color-scheme', 'normal')
  await expect(page.locator('main input')).toHaveCSS('color-scheme', 'normal')
  await expect(page.locator('.scalar-app')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('.scalar-app input')).toHaveCSS('color-scheme', 'dark')
  await expect(page.locator('.scalar-app .light-mode')).toHaveCSS('color-scheme', 'light')
})

test('the color mode keeps a host page color scheme', async ({ page }) => {
  await page.setContent(`
    <style>body { color-scheme: light; }</style>
    <body class="dark-mode"><div class="scalar-app">Reference</div></body>
  `)
  await page.addStyleTag({ path: join(packageRoot, 'dist/style.css') })

  await expect(page.locator('body')).toHaveCSS('color-scheme', 'light')
  await expect(page.locator('.scalar-app')).toHaveCSS('color-scheme', 'dark')
})

test('the color scheme follows the mode on pages that put scalar-app on the body', async ({ page }) => {
  await page.setContent('<body class="scalar-app light-mode"><div class="dark-mode">Code example</div></body>')
  await page.addStyleTag({ path: join(packageRoot, 'dist/style.css') })

  await expect(page.locator('body')).toHaveCSS('color-scheme', 'light')
  await expect(page.locator('.dark-mode')).toHaveCSS('color-scheme', 'dark')
})

/** A block pinned to one mode, like `createCodeExample(el, { darkMode: true })`, keeps it on a page in the other mode. */
test('a pinned color mode wins over the page color mode', async ({ page }) => {
  await page.setContent(`
    <body class="light-mode">
      <div class="scalar-app dark-mode" id="pinned-dark">Dark block</div>
    </body>
  `)
  await page.addStyleTag({ path: join(packageRoot, 'dist/style.css') })
  await expect(page.locator('#pinned-dark')).toHaveCSS('color-scheme', 'dark')

  await page.evaluate(() => {
    document.body.className = 'dark-mode'
    document.body.innerHTML = '<div class="scalar-app light-mode" id="pinned-light">Light block</div>'
  })
  await expect(page.locator('#pinned-light')).toHaveCSS('color-scheme', 'light')
})

/** Teleported popovers render their own `.scalar-app` inside a pinned block and should follow it. */
test('a nested scalar-app follows its pinned ancestor', async ({ page }) => {
  await page.setContent(`
    <body class="light-mode">
      <div class="scalar-app dark-mode"><div><div class="scalar-app" id="nested-dark">Popover</div></div></div>
    </body>
  `)
  await page.addStyleTag({ path: join(packageRoot, 'dist/style.css') })
  await expect(page.locator('#nested-dark')).toHaveCSS('color-scheme', 'dark')

  await page.evaluate(() => {
    document.body.className = 'dark-mode'
    document.body.innerHTML =
      '<div class="scalar-app light-mode"><div><div class="scalar-app" id="nested-light">Popover</div></div></div>'
  })
  await expect(page.locator('#nested-light')).toHaveCSS('color-scheme', 'light')
})
