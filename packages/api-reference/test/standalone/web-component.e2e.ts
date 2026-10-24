import { join } from 'node:path'

import { expect, test } from '@playwright/test'

const bundle = join(import.meta.dirname, '../../dist/webComponent/component.js')

// Test the shipped bundle without depending on a CDN or an API server.
test('web component isolates CSS, updates configuration, and survives reconnection', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<style>button { background: rgb(255, 0, 0) !important; }</style><button id="host-button">Host button</button><scalar-api-reference></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Shadow API', version: '1.0.0' }, paths: {} },
        showDeveloperTools: 'never',
        darkMode: false,
      },
    })
  })
  await page.addScriptTag({ path: bundle })
  const element = page.locator('scalar-api-reference')
  await expect(element.getByRole('heading', { name: 'Shadow API', exact: true })).toBeVisible()
  await expect(page.locator('#host-button')).toHaveCSS('background-color', 'rgb(255, 0, 0)')
  await expect(element.getByRole('button', { name: 'Open Search', exact: false })).not.toHaveCSS(
    'background-color',
    'rgb(255, 0, 0)',
  )
  expect(await element.evaluate((el) => el.shadowRoot !== null)).toBe(true)
  expect(await element.evaluate((el) => getComputedStyle(el).getPropertyValue('--scalar-font-size-1').trim())).toBe(
    '21px',
  )

  // Loading the same browser script twice must not attempt a duplicate registration.
  await page.addScriptTag({ path: bundle })
  await element.evaluate((el) => {
    Object.assign(el, {
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Updated API', version: '2.0.0' }, paths: {} },
        showDeveloperTools: 'never',
        darkMode: false,
      },
    })
  })
  await expect(element.getByRole('heading', { name: 'Updated API', exact: true })).toBeVisible()
  await element.evaluate(async (el) => {
    el.remove()
    await new Promise((resolve) => setTimeout(resolve, 0))
    document.body.append(el)
  })
  await expect(element.getByRole('heading', { name: 'Updated API', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('web component theme changes preserve the host preference', async ({ page }) => {
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<body class="light-mode"><scalar-api-reference></scalar-api-reference></body>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    localStorage.setItem('colorMode', 'light')
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Theme API', version: '1.0.0' }, paths: {} },
        showDeveloperTools: 'never',
        darkMode: true,
      },
    })
  })
  await page.addScriptTag({ path: bundle })
  const element = page.locator('scalar-api-reference')
  await element.getByRole('button', { name: 'Set light mode', exact: true }).click()
  await expect(element.getByRole('button', { name: 'Set dark mode', exact: true })).toBeVisible()
  await expect(page.locator('body')).toHaveAttribute('class', 'light-mode')
  expect(await page.evaluate(() => localStorage.getItem('colorMode'))).toBe('light')
})

test('embedded search stays styled, traps focus, dismisses, and cleans up', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<style>button, input, dialog { background: rgb(255, 0, 0) !important; } .opacity-0 { opacity: 0 !important; } .border { border: 9px solid red !important; } h1, h2 { font-size: 3px !important; }</style><button id="host">Host</button><scalar-api-reference id="first"></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    document.documentElement.style.setProperty('overflow', 'scroll', 'important')
    for (const element of document.querySelectorAll('scalar-api-reference')) {
      Object.assign(element, {
        configuration: {
          content: { openapi: '3.1.0', info: { title: 'Search API', version: '1.0.0' }, paths: {} },
          showDeveloperTools: 'never',
          darkMode: false,
        },
      })
    }
  })
  await page.addScriptTag({ path: bundle })
  const first = page.locator('scalar-api-reference#first')
  const trigger = first.getByRole('button', { name: 'Open Search', exact: false })
  await trigger.click()
  const dialog = first.getByRole('dialog')
  const input = dialog.getByRole('combobox')
  await expect(dialog).toBeVisible()
  await expect(input).toBeFocused()
  await expect(input).not.toHaveCSS('background-color', 'rgb(255, 0, 0)')
  expect(await page.evaluate(() => document.body.querySelectorAll('[role="dialog"], dialog').length)).toBe(0)
  const screenshot = testInfo.outputPath('embedded-search.png')
  await page.screenshot({ path: screenshot, animations: 'disabled' })
  await testInfo.attach('Embedded search', { path: screenshot, contentType: 'image/png' })
  await input.fill('Search')
  for (let index = 0; index < 5; index++) {
    await page.keyboard.press('Tab')
    // Native dialogs can yield focus to browser chrome, but never to the page behind them.
    expect(
      await dialog.evaluate((el) => {
        const active = (el.getRootNode() as ShadowRoot).activeElement
        return active ? el.contains(active) : document.activeElement === document.body
      }),
    ).toBe(true)
  }
  await page.locator('#host').evaluate((el) => el.focus())
  await expect(page.locator('#host')).not.toBeFocused()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.locator('html')).toHaveCSS('overflow', 'scroll')
  expect(await page.locator('html').evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important')

  await trigger.press('ControlOrMeta+k')
  await expect(dialog).toBeVisible()
  const inputBounds = await input.boundingBox()
  expect(inputBounds).not.toBeNull()
  await page.mouse.move(inputBounds!.x + 10, inputBounds!.y + 10)
  await page.mouse.down()
  await page.mouse.move(4, 4)
  await page.mouse.up()
  await expect(dialog).toBeVisible()
  await page.mouse.click(4, 4)
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(dialog).toBeVisible()
  await first.evaluate((el) => el.remove())
  await expect(page.locator('html')).toHaveCSS('overflow', 'scroll')
  expect(await page.locator('html').evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important')
  await page.locator('#host').focus()
  await expect(page.locator('#host')).toBeFocused()
  expect(errors).toEqual([])
})

test('tooltips stay inside embedded dialogs and disappear when the embed unmounts', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<style>[role="tooltip"] { color: rgb(255, 0, 0) !important; }</style><scalar-api-reference></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() =>
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: { openapi: '3.1.0', info: { title: 'Tooltip API', version: '1.0.0' }, paths: {} },
        showDeveloperTools: 'never',
        darkMode: false,
      },
    }),
  )
  await page.addScriptTag({ path: bundle })
  const element = page.locator('scalar-api-reference')
  await element.getByRole('button', { name: 'Generate SDKs & MCP', exact: true }).click()
  const dialog = element.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await expect(dialog).toHaveAccessibleName('Everything your API needs, from one OpenAPI document')
  await dialog.getByRole('link', { name: 'Message Marc on X', exact: false }).hover()
  const tooltip = dialog.getByRole('tooltip')
  await expect(tooltip).toHaveText('or just DM me on X!')
  await expect(tooltip).toBeVisible()
  await expect(tooltip).not.toHaveCSS('color', 'rgb(255, 0, 0)')
  const screenshot = testInfo.outputPath('embedded-tooltip.png')
  await page.screenshot({ path: screenshot, animations: 'disabled' })
  await testInfo.attach('Embedded tooltip', { path: screenshot, contentType: 'image/png' })
  expect(await page.evaluate(() => document.querySelector('[role="tooltip"]'))).toBeNull()
  await element.evaluate((el) => el.remove())
  await expect(page.getByRole('tooltip')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('embedded request client keeps focus, styles, and lifecycle inside its shadow root', async ({
  page,
}, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<style>button, input, dialog { background: rgb(255, 0, 0) !important; }</style><button id="host">Host button</button><scalar-api-reference></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    document.documentElement.style.setProperty('overflow', 'scroll', 'important')
    document.body.style.overflow = 'auto'
    Object.assign(document.querySelector('scalar-api-reference')!, {
      configuration: {
        content: {
          openapi: '3.1.0',
          info: { title: 'Request API', version: '1.0.0' },
          paths: { '/ping': { get: { summary: 'Ping', responses: { '200': { description: 'OK' } } } } },
        },
        darkMode: false,
        showDeveloperTools: 'never',
      },
    })
  })
  await page.addScriptTag({ path: bundle })
  const element = page.locator('scalar-api-reference')
  const trigger = element.getByRole('button', { name: 'Test Request (get /ping)', exact: true }).first()
  await trigger.click()
  const dialog = element.getByRole('dialog', { name: 'API Client', exact: true })
  await expect(dialog).toBeVisible()
  const close = dialog.getByRole('button', { name: 'Close Client', exact: true })
  await expect(close).toBeFocused()
  await expect(close).not.toHaveCSS('background-color', 'rgb(255, 0, 0)')
  expect(await page.evaluate(() => document.querySelector('[role="dialog"], dialog'))).toBeNull()
  await page.locator('#host').evaluate((el) => el.focus())
  await expect(page.locator('#host')).not.toBeFocused()
  await page.screenshot({ path: testInfo.outputPath('embedded-request-client.png'), animations: 'disabled' })
  await close.press('ControlOrMeta+k')
  const search = element.getByRole('dialog', { name: 'Search', exact: true })
  await expect(search.getByRole('combobox')).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(search).not.toBeVisible()
  await expect(dialog).toBeVisible()
  await expect(page.locator('html')).toHaveCSS('overflow', 'hidden')
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(page.locator('html')).toHaveCSS('overflow', 'scroll')
  expect(await page.locator('html').evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important')
  await expect(page.locator('body')).toHaveCSS('overflow', 'auto')
  await trigger.click()
  await expect(dialog).toBeVisible()
  await close.click()
  await expect(dialog).not.toBeVisible()
  await trigger.click()
  await expect(dialog).toBeVisible()
  await element.evaluate((el) => el.remove())
  await expect(page.locator('html')).toHaveCSS('overflow', 'scroll')
  expect(await page.locator('html').evaluate((el) => el.style.getPropertyPriority('overflow'))).toBe('important')
  await expect(page.locator('body')).toHaveCSS('overflow', 'auto')
  await page.locator('#host').focus()
  await expect(page.locator('#host')).toBeFocused()
  expect(errors).toEqual([])
})

test('embedded toasts stay styled without injecting host styles', async ({ page }, testInfo) => {
  await page.route('https://component.example.test/', (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<style>.scalar-embedded-toast, button { background: rgb(255, 0, 0) !important; }</style><button id="host-button">Host button</button><scalar-api-reference id="first"></scalar-api-reference>',
    }),
  )
  await page.goto('https://component.example.test/')
  await page.evaluate(() => {
    // Exercise the real error notification without depending on browser clipboard permissions.
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })
    Object.assign(document.getElementById('first')!, {
      configuration: {
        content: {
          openapi: '3.1.0',
          info: { title: 'Toast API', version: '1.0.0' },
          paths: {
            '/ping/{id}': {
              get: {
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { '200': { description: 'OK' } },
              },
            },
          },
        },
        showDeveloperTools: 'never',
        darkMode: false,
      },
    })
  })
  await page.addScriptTag({ path: bundle })
  const first = page.locator('scalar-api-reference#first')
  await first.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
  const alert = first.getByRole('alert').filter({ hasText: 'Failed to copy Markdown' })
  await expect(alert).toBeVisible()
  await expect(alert).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(page.locator('#host-button')).toHaveCSS('background-color', 'rgb(255, 0, 0)')
  expect(
    await page.evaluate(() =>
      [...document.head.querySelectorAll('style')].some((style) => style.textContent?.includes('data-sonner-toaster')),
    ),
  ).toBe(false)
  await alert.hover()
  await page.screenshot({ path: testInfo.outputPath('embedded-toast.png') })
  await alert.getByRole('button', { name: 'Dismiss notification' }).click()
  await expect(alert).toHaveCount(0)
  await first.getByRole('button', { name: 'Test Request (get /ping/{id})', exact: true }).click()
  const client = first.getByRole('dialog', { name: 'API Client', exact: true })
  await client.getByRole('button', { name: 'Send get request to /ping/{id}', exact: true }).click()
  const clientToast = client.getByRole('alert').filter({ hasText: 'Path parameters must have values.' })
  await expect(clientToast).toBeVisible()
  await expect(clientToast).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await clientToast.getByRole('button', { name: 'Dismiss notification' }).click()
  await expect(clientToast).toHaveCount(0)
  await client.getByRole('button', { name: 'Close Client', exact: true }).click()
  await first.getByRole('button', { name: 'Copy as Markdown', exact: true }).click()
  await expect(alert).toBeVisible()
  await first.evaluate((el) => el.remove())
  await expect(page.getByText('Failed to copy Markdown', { exact: true })).toHaveCount(0)
})
