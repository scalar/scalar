import { readFile } from 'node:fs/promises'
import { type Server, createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

import { expect, test } from '@playwright/test'
import type { CreateApiReference } from '@scalar/types/api-reference'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { ApiReference } from '../../dist/index.js'

type TestWindow = typeof window & {
  Scalar: { createApiReference: CreateApiReference }
  reference: ReturnType<CreateApiReference>
  originalHeading: Element | null
  originalOperation: Element | null
  loaded: number
}

const content = {
  openapi: '3.1.0',
  info: {
    title: 'Prepared Hydration API',
    version: '1.0.0',
    description: 'This content stays readable while the client prepares.',
  },
  servers: [{ url: 'https://example.com' }],
  tags: [{ name: 'Things' }],
  paths: {
    '/things': {
      get: {
        tags: ['Things'],
        summary: 'List things',
        parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Thing' } } },
            },
          },
        },
      },
    },
    '/items': { post: { tags: ['Things'], summary: 'Create item', responses: { '201': { description: 'Created' } } } },
  },
  components: {
    schemas: {
      Thing: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'archived'] },
        },
      },
    },
  },
}
let server: Server
let baseUrl: string

// One server emits actual SSR HTML and serves the built standalone bundle. The source
// response is controlled per browser test so slow and failed loads are deterministic.
test.beforeAll(async () => {
  const css = await readFile(new URL('../../dist/style.css', import.meta.url), 'utf8')
  const js = await readFile(new URL('../../dist/browser/standalone.js', import.meta.url))
  let html = ''
  server = createServer((request, response) => {
    if (request.url === '/scalar.js') {
      response.setHeader('Content-Type', 'application/javascript; charset=utf-8')
      response.end(js)
      return
    }
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end(html)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const configuration = {
    url: `${baseUrl}/document`,
    agent: { disabled: true },
    withDefaultFonts: false,
    defaultOpenFirstTag: true,
  }
  const app = createSSRApp({
    render: () =>
      h(ApiReference, {
        configuration: { ...configuration, customFetch: async () => new Response(JSON.stringify(content)) },
      }),
  })
  app.config.idPrefix = 'scalar-refs'
  const rendered = await renderToString(app)
  html = `<!doctype html><html><head><style>${css}</style></head><body><div id="app">${rendered}</div>
    <script src="/scalar.js"></script><script>
    window.configuration = ${JSON.stringify(configuration)};
    </script></body></html>`
})

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())))
})

test('keeps the original content through a slow load and hydrates its existing nodes', async ({ page }, testInfo) => {
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/document', async (route) => {
    await pending
    await route.fulfill({ json: content })
  })
  await page.goto(baseUrl)
  const title = page.getByRole('heading', { name: content.info.title, exact: true })
  await expect(title).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath('before_hydration.png') })
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.originalHeading = document.querySelector('h1')
    state.originalOperation =
      [...document.querySelectorAll('h2,h3')].find((node) => node.textContent === 'List things') ?? null
    state.loaded = 0
    state.reference = state.Scalar.createApiReference('#app', {
      ...state.configuration,
      onLoaded: () => {
        state.loaded++
      },
    })
  })
  // Longer than the removed takeover timeout: readable content must not expire.
  await page.waitForTimeout(1700)
  await expect(title).toBeVisible()
  expect(await page.evaluate(() => (window as TestWindow).loaded)).toBe(0)
  expect(await page.evaluate(() => (window as TestWindow).originalHeading === document.querySelector('h1'))).toBe(true)
  release?.()
  await expect.poll(() => page.evaluate(() => (window as TestWindow).loaded)).toBe(1)
  await expect(title).toBeVisible()
  expect(await page.evaluate(() => (window as TestWindow).originalHeading === document.querySelector('h1'))).toBe(true)
  expect(await page.evaluate(() => (window as TestWindow).originalOperation?.isConnected)).toBe(true)
  expect(hydrationErrors).toStrictEqual([])
  await page.getByRole('button', { name: 'Search', exact: false }).first().click()
  await expect(page.getByRole('combobox', { name: 'Enter search query' })).toBeVisible()
  await page.keyboard.press('Escape')
  await page.screenshot({ path: testInfo.outputPath('after_hydration.png') })
})

test('preserves readable server content when preparation fails', async ({ page }) => {
  await page.route('**/document', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto(baseUrl)
  const failure = page.waitForEvent('console', {
    predicate: (message) => message.text().includes('Could not prepare API References:'),
  })
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.originalHeading = document.querySelector('h1')
    state.reference = state.Scalar.createApiReference('#app', state.configuration)
  })
  await failure
  await expect(page.getByRole('heading', { name: content.info.title, exact: true })).toBeVisible()
  expect(await page.evaluate(() => (window as TestWindow).originalHeading === document.querySelector('h1'))).toBe(true)
})

test('does not mount after destruction while preparation is pending', async ({ page }) => {
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/document', async (route) => {
    await pending
    await route.fulfill({ json: content })
  })
  await page.goto(baseUrl)
  const requested = page.waitForRequest('**/document')
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.loaded = 0
    state.reference = state.Scalar.createApiReference('#app', {
      ...state.configuration,
      onLoaded: () => {
        state.loaded++
      },
    })
  })
  await requested
  await page.evaluate(() => (window as TestWindow).reference.destroy())
  release?.()
  await page.waitForTimeout(100)
  expect(await page.evaluate(() => (window as TestWindow).loaded)).toBe(0)
  await expect(page.getByRole('heading', { name: content.info.title, exact: true })).toBeVisible()
})

test('hydrates before applying a deep link and saved dark-mode preference', async ({ page }) => {
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  await page.route('**/document', (route) => route.fulfill({ json: content }))
  await page.goto(baseUrl)
  const href = await page.getByRole('link', { name: 'Create item', exact: false }).first().getAttribute('href')
  expect(href).not.toBeNull()
  await page.evaluate((hash) => {
    localStorage.setItem('colorMode', 'dark')
    window.location.hash = hash ?? ''
  }, href)
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.loaded = 0
    state.reference = state.Scalar.createApiReference('#app', {
      ...state.configuration,
      onLoaded: () => {
        state.loaded++
      },
    })
  })
  await expect.poll(() => page.evaluate(() => (window as TestWindow).loaded)).toBe(1)
  await expect(page.getByRole('heading', { name: 'Create item', exact: true })).toBeInViewport()
  expect(hydrationErrors).toStrictEqual([])
  await expect(page.locator('body')).toHaveClass(/dark-mode/)
})

test('uses a replacement configuration when the pending source fails', async ({ page }) => {
  let release: (() => void) | undefined
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route('**/document', async (route) => {
    await pending
    await route.fulfill({ status: 503, body: 'Unavailable' })
  })
  const hydrationErrors: string[] = []
  page.on('console', (message) => {
    if (/hydration/i.test(message.text())) {
      hydrationErrors.push(message.text())
    }
  })
  await page.goto(baseUrl)
  const requested = page.waitForRequest('**/document')
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.loaded = 0
    state.reference = state.Scalar.createApiReference('#app', state.configuration)
  })
  await requested
  await page.evaluate(
    (document) => {
      const state = window as TestWindow
      state.reference.updateConfiguration({
        content: document,
        onLoaded: () => {
          state.loaded++
        },
      })
    },
    { ...content, info: { ...content.info, title: 'Replacement API' } },
  )
  release?.()
  await expect.poll(() => page.evaluate(() => (window as TestWindow).loaded)).toBe(1)
  await expect(page.getByRole('heading', { name: 'Replacement API', exact: true })).toBeVisible()
  expect(hydrationErrors).toStrictEqual([])
})

test('recovers when configuration changes after preparation has failed', async ({ page }) => {
  await page.route('**/document', (route) => route.fulfill({ status: 503, body: 'Unavailable' }))
  await page.goto(baseUrl)
  const failed = page.waitForEvent('console', (message) => message.text().includes('Could not prepare API References:'))
  await page.evaluate(() => {
    const state = window as TestWindow & { configuration: Parameters<CreateApiReference>[1] }
    state.loaded = 0
    state.reference = state.Scalar.createApiReference('#app', state.configuration)
  })
  await failed
  await expect(page.getByRole('heading', { name: content.info.title, exact: true })).toBeVisible()
  await page.evaluate(
    (document) => {
      const state = window as TestWindow
      state.reference.updateConfiguration({
        content: document,
        onLoaded: () => {
          state.loaded++
        },
      })
    },
    { ...content, info: { ...content.info, title: 'Recovered API' } },
  )
  await expect.poll(() => page.evaluate(() => (window as TestWindow).loaded)).toBe(1)
  await expect(page.getByRole('heading', { name: 'Recovered API', exact: true })).toBeVisible()
})
