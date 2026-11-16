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

const operation = (tag: string, summary: string) => ({
  tags: [tag],
  summary,
  responses: { '200': { description: 'OK' } },
})

/** Two tags, so the first one opens by default and the second one stays closed. */
const taggedDocument = {
  openapi: '3.1.0',
  info: { title: 'Hydration regression', version: '1.0.0' },
  tags: [{ name: 'planets', description: 'Everything about planets.' }, { name: 'moons' }],
  paths: {
    '/planets': { get: operation('planets', 'List planets') },
    '/moons': { get: operation('moons', 'List moons') },
  },
}

const authorizationCode = {
  authorizationUrl: 'https://example.com/authorize',
  tokenUrl: 'https://example.com/token',
  scopes: { 'read:planets': 'Read planets' },
}

test.describe('server-rendered references', () => {
  for (const { name, configuration } of [
    { name: 'the first tag open by default', configuration: { content: taggedDocument } },
    { name: 'the classic layout', configuration: { layout: 'classic', content: taggedDocument } },
    {
      name: 'a bearer token with an OAuth 2.0 shortcut',
      configuration: {
        content: {
          ...taggedDocument,
          security: [{ bearerAuth: [] }],
          components: {
            securitySchemes: {
              bearerAuth: { type: 'http', scheme: 'bearer' },
              oAuth2: { type: 'oauth2', flows: { authorizationCode } },
            },
          },
        },
      },
    },
    {
      name: 'an OAuth 2.0 flow',
      configuration: {
        content: {
          ...taggedDocument,
          security: [{ oAuth2: [] }],
          components: { securitySchemes: { oAuth2: { type: 'oauth2', flows: { authorizationCode } } } },
        },
      },
    },
    {
      name: 'OpenID Connect discovery',
      configuration: {
        content: {
          ...taggedDocument,
          security: [{ openId: [] }],
          components: {
            securitySchemes: {
              openId: {
                type: 'openIdConnect',
                openIdConnectUrl: 'https://example.com/.well-known/openid-configuration',
              },
            },
          },
        },
      },
    },
    {
      name: 'named request examples',
      configuration: {
        content: {
          ...taggedDocument,
          paths: {
            '/planets': {
              post: {
                ...operation('planets', 'Create a planet'),
                requestBody: {
                  content: {
                    'application/json': {
                      examples: {
                        mars: { summary: 'Mars', value: { name: 'Mars' } },
                        venus: { summary: 'Venus', value: { name: 'Venus' } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  ] satisfies { name: string; configuration: Partial<ApiReferenceConfiguration> }[]) {
    test(`hydrates ${name} without replacing server markup`, async ({ page }) => {
      const hydrationErrors: string[] = []
      page.on('pageerror', (error) => hydrationErrors.push(error.message))
      page.on('console', (message) => {
        if (/hydration/i.test(message.text())) {
          hydrationErrors.push(message.text())
        }
      })

      const html = await renderApiReferenceToString(configuration)
      await page.route('https://ssr.example.test/', (route) =>
        route.fulfill({
          contentType: 'text/html; charset=utf-8',
          body: `<!doctype html><html><body><div id="app">${html}</div></body></html>`,
        }),
      )
      await page.goto('https://ssr.example.test/')
      await expect(page.getByRole('heading', { name: 'Hydration regression', level: 1 })).toBeVisible()

      await page.addScriptTag({ content: getJsAsset() })
      // Hydration is synchronous, so every element the server sent must still be in the page.
      const replaced = await page.evaluate((configuration) => {
        const serverElements = [...document.querySelectorAll('#app *')]
        const parents = new Map(serverElements.map((element) => [element, element.parentElement]))

        // Vue re-applies `v-html` while hydrating, which swaps in identical children. That is not a repair.
        const rewritten = new Set<Element>()
        const innerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
        Object.defineProperty(Element.prototype, 'innerHTML', {
          ...innerHTML,
          set(value: string) {
            rewritten.add(this)
            innerHTML?.set?.call(this, value)
          },
        })
        const isInsideRewrite = (element: Element): boolean => {
          for (let parent = parents.get(element); parent; parent = parents.get(parent)) {
            if (rewritten.has(parent)) {
              return true
            }
          }
          return false
        }

        window.Scalar.createApiReference('#app', configuration)

        return serverElements.filter((element) => !element.isConnected && !isInsideRewrite(element)).length
      }, configuration)

      expect(replaced).toBe(0)
      await expect(page.locator('script[data-scalar-hydration]')).toHaveCount(0)
      expect(hydrationErrors).toStrictEqual([])
    })
  }
})
