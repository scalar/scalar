import { join } from 'node:path'

import { expect, test } from '@playwright/test'
import { serveHTMLExample } from '@test/utils/serve-example'

test.describe('embedded client', () => {
  for (const { name, css } of [
    { name: 'outer query container', css: '' },
    { name: 'host hidden utility', css: '.hidden { display: none !important; }' },
    { name: 'inner query container', css: '.address-bar-bg-states { container-type: inline-size; }' },
    {
      name: 'wide inner query container',
      css: '.address-bar-bg-states { container-type: inline-size; min-width: 800px; }',
    },
  ]) {
    test(`keeps exactly one working Send button with ${name}`, async ({ page }) => {
      const { url, shutdown } = await serveHTMLExample(join(import.meta.dirname, 'html', 'embedded-client.html'))
      await page.setViewportSize({ width: 1440, height: 1000 })
      await page.route(`${url}/dist/browser/**`, async (route) => {
        await route.fulfill({ path: join(import.meta.dirname, '../..', new URL(route.request().url()).pathname) })
      })
      await page.route('https://api.example.test/ping', async (route) => {
        await route.fulfill({ json: { message: 'pong' } })
      })

      try {
        await page.goto(url)
        if (css) {
          await page.addStyleTag({ content: css })
        }
        await page.getByRole('button', { name: 'Test Request' }).click()

        const sendButtons = page.locator('[data-addressbar-action="send"]')
        const visibleSendButton = page.getByRole('button', {
          name: 'Send get request to https://api.example.test/ping',
          exact: true,
        })
        // Exercise the exact content-width boundary and a normal desktop width.
        for (const width of [767, 768, 769, 1100]) {
          await page.locator('.t-app__top-container').evaluate((header, width) => {
            header.style.width = `${width}px`
            header.style.boxSizing = 'content-box'
          }, width)

          await expect(visibleSendButton).toHaveCount(1)
          await expect(sendButtons.nth(width < 768 ? 1 : 0)).toBeVisible()
          await expect(sendButtons.nth(width < 768 ? 0 : 1)).toBeHidden()
          const request = page.waitForRequest('https://api.example.test/ping')
          await visibleSendButton.click()
          expect((await request).method()).toBe('GET')
          await expect(visibleSendButton).not.toHaveAttribute('aria-disabled', 'true')
        }
      } finally {
        shutdown()
      }
    })
  }
})
