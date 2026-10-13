import { join } from 'node:path'

import { expect, test } from '@playwright/test'
import type { CreateApiReference } from '@scalar/types/api-reference'

const packageRoot = join(import.meta.dirname, '../..')

test.beforeEach(async ({ page }) => {
  await page.route('https://host.example.test/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  )
  await page.goto('https://host.example.test/')
})

test('Scalar dialogs never restyle host Headless UI portals', async ({ page }) => {
  await page.setContent(`
    <div id="headlessui-portal-root"><div data-headlessui-portal><button id="host-dialog">Host dialog</button></div></div>
    <div id="reference"></div>
  `)
  await page.addScriptTag({ path: join(packageRoot, 'dist/browser/standalone.js') })
  await page.evaluate(() => {
    const scalar = (window as unknown as { Scalar: { createApiReference: CreateApiReference } }).Scalar
    scalar.createApiReference('#reference', {
      content: { openapi: '3.1.0', info: { title: 'Dialog API', version: '1.0.0' }, paths: {} },
      darkMode: false,
      showDeveloperTools: 'never',
    })
  })
  await page.getByRole('button', { name: 'Open Search', exact: false }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('combobox')).toBeVisible()
  await expect(dialog.getByRole('combobox')).toBeFocused()
  await expect(dialog.locator('.scalar-modal')).toHaveCSS('background-color', 'rgb(255, 255, 255)')
  await expect(dialog).toHaveClass(/scalar-app/)
  await expect(page.locator('#headlessui-portal-root')).not.toHaveClass(/scalar-app/)
  expect(await page.locator('#host-dialog').evaluate((el) => el.closest('.scalar-app'))).toBeNull()
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
