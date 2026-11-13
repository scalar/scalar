import { expect, test } from '@playwright/test'
import type { ApiReferenceConfiguration } from '@scalar/types/api-reference'

import { getJsAsset, renderApiReferenceToString } from '../../../server-side-rendering/src/ssr'

const configuration = {
  defaultOpenAllTags: true,
  forceDarkModeState: 'light',
  content: {
    openapi: '3.1.0',
    info: { title: 'Hydration regression', version: '1.0.0' },
    tags: [{ name: 'example' }],
    paths: {
      '/things': {
        get: {
          tags: ['example'],
          summary: 'List things',
          responses: {
            '200': {
              description: 'OK',
              content: {
                'application/json': { schema: { type: 'object' } },
                'application/x-ndjson': { schema: { type: 'object' } },
              },
            },
            '404': {
              description: 'Not found',
              content: {
                'application/json': { schema: { type: 'object' } },
                'application/x-ndjson': { schema: { type: 'object' } },
              },
            },
          },
        },
      },
    },
  },
} satisfies Partial<ApiReferenceConfiguration>

test.describe('server-rendered teleports', () => {
  for (const { name, host, referenceCount } of [
    { name: 'a host header', host: '<header id="host">Host content</header>', referenceCount: 1 },
    { name: 'a host div', host: '<div id="host">Host content</div>', referenceCount: 1 },
    { name: 'the reference as the second body child', host: '', referenceCount: 1 },
    { name: 'two references', host: '<header id="host">Host content</header>', referenceCount: 2 },
  ]) {
    test(`preserves ${name} and hydrates every content-type menu`, async ({ page }) => {
      const html = await renderApiReferenceToString(configuration)
      const references = Array.from(
        { length: referenceCount },
        (_, index) => `<div id="app-${index}" data-reference>${html}</div>`,
      ).join('')
      const hydrationErrors: string[] = []
      page.on('pageerror', (error) => hydrationErrors.push(error.message))
      page.on('console', (message) => {
        if (/hydration/i.test(message.text())) {
          hydrationErrors.push(message.text())
        }
      })

      await page.route('https://ssr.example.test/', (route) =>
        route.fulfill({
          contentType: 'text/html; charset=utf-8',
          body: `<!doctype html><html><body><a id="skip" href="#app-0">Skip to reference</a>${host}${references}<footer id="footer">Host footer</footer></body></html>`,
        }),
      )
      await page.goto('https://ssr.example.test/')

      // Ensure this exercises hydration of existing dropdowns rather than client-only rendering.
      const menus = page.getByRole('button', { name: /Selected Content Type/ })
      await expect(menus).toHaveCount(referenceCount * 2)
      const serverElements = await page.evaluateHandle(() => [
        ...document.querySelectorAll('#skip, #host, #footer, [data-reference]'),
        ...Array.from(document.querySelectorAll('[data-reference]'), (element) => element.firstElementChild),
      ])

      await page.addScriptTag({ content: getJsAsset() })
      await page.evaluate(
        ({ configuration, referenceCount }) => {
          for (let index = 0; index < referenceCount; index++) {
            window.Scalar.createApiReference(`#app-${index}`, configuration)
          }
        },
        { configuration, referenceCount },
      )

      for (let index = 0; index < referenceCount * 2; index++) {
        await menus.nth(index).click()
        await page.getByRole('option', { name: 'application/x-ndjson', exact: true }).click()
        await expect(menus.nth(index)).toContainText('application/x-ndjson')
      }

      expect(await serverElements.evaluate((elements) => elements.every((element) => element?.isConnected))).toBe(true)
      await expect(page.locator('#skip')).toHaveText('Skip to reference')
      await expect(page.locator('#footer')).toHaveText('Host footer')
      if (host) {
        await expect(page.locator('#host')).toHaveText('Host content')
      }
      expect(hydrationErrors).toStrictEqual([])
    })
  }
})
