import { isObject } from '@scalar/helpers/object/is-object'
import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import { isOpenApiDocument } from '@scalar/workspace-store/schemas/type-guards'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'
import { parseHydrationState } from '@/helpers/hydration-state'

import { createApiReference } from './html-api'

const content = {
  openapi: '3.1.0',
  info: { title: 'Snapshot API', version: '1.0.0' },
  paths: { '/things': { get: { summary: 'List things', responses: { '200': { description: 'OK' } } } } },
}

const hydrationMessages = (): string[] =>
  [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
    .flat()
    .map(String)
    .filter((message) => /hydration/i.test(message))

afterEach(() => {
  document.body.innerHTML = ''
  window.localStorage.removeItem('colorMode')
  window.history.replaceState({}, '', '/')
})

describe('html-api.snapshot', () => {
  it.each(['modern', 'classic'] as const)(
    'preserves configured dark mode during server rendering in %s layout',
    async (layout) => {
      window.localStorage.removeItem('colorMode')
      const configuration = apiReferenceConfigurationWithSourceSchema({ content, layout, darkMode: true })
      const app = createSSRApp({ render: () => h(ApiReference, { configuration }) })
      const element = document.createElement('div')
      element.innerHTML = await renderToString(app)

      expect(element.querySelector('[aria-label="Set light mode"]')?.getAttribute('aria-label')).toBe('Set light mode')
      expect(element.querySelector('[aria-label="Set dark mode"]')).toBeNull()
      const state = parseHydrationState(element.querySelector('script[data-scalar-hydration]')!.textContent!)
      expect(state.reference.meta['x-scalar-color-mode']).toBe('dark')
    },
  )

  it.each(['modern', 'classic'] as const)(
    'applies a saved dark preference after direct Vue hydration in %s layout',
    async (layout) => {
      window.localStorage.removeItem('colorMode')
      const configuration = apiReferenceConfigurationWithSourceSchema({ content, layout, darkMode: false })
      const createApp = () => createSSRApp({ render: () => h(ApiReference, { configuration }) })
      const element = document.createElement('div')
      element.innerHTML = await renderToString(createApp())
      document.body.append(element)
      const heading = element.querySelector('h1')
      const toggle = element.querySelector('[aria-label="Set dark mode"]')
      expect(toggle?.getAttribute('aria-label')).toBe('Set dark mode')
      window.localStorage.setItem('colorMode', 'dark')
      consoleWarnSpy.mockClear()
      consoleErrorSpy.mockClear()

      const app = createApp()
      try {
        app.mount(element)
        expect(element.querySelector('h1')).toBe(heading)
        expect(toggle?.getAttribute('aria-label')).toBe('Set dark mode')
        await flushPromises()
        await nextTick()
        expect(toggle?.getAttribute('aria-label')).toBe('Set light mode')
        expect(hydrationMessages()).toStrictEqual([])
        expect(element.querySelector('script[data-scalar-hydration]')).toBeNull()
      } finally {
        app.unmount()
      }
    },
  )

  it('hydrates a URL snapshot offline and accepts a later configuration without duplicate callbacks', async () => {
    const schema = { type: 'string', description: 'Identifier from the external description' }
    const serverFetch = vi.fn<typeof fetch>((input) => {
      const url = String(input)
      if (url === 'https://example.com/model.json') {
        return Promise.resolve(new Response(JSON.stringify(schema)))
      }
      if (url === 'https://example.com/openapi.json') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              ...content,
              components: { schemas: { Identifier: { $ref: './model.json' } } },
              'x-scalar-environments': { production: { variables: [{ name: 'token', value: 'example' }] } },
              'x-scalar-active-environment': 'production',
            }),
          ),
        )
      }
      return Promise.reject(new Error(`Unexpected server fetch: ${url}`))
    })
    const onLoaded = vi.fn()
    const onDocumentSelect = vi.fn()
    const configuration = apiReferenceConfigurationWithSourceSchema({
      url: 'https://example.com/openapi.json',
      customFetch: serverFetch,
      servers: [{ url: 'https://configured.example.com/{region}', variables: { region: { default: 'eu' } } }],
      forceDarkModeState: 'light',
      onLoaded,
      onDocumentSelect,
    })
    const serverApp = createSSRApp({ render: () => h(ApiReference, { configuration }) })
    serverApp.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(serverApp)
    document.body.append(element)
    await flushPromises()
    expect(serverFetch.mock.calls.map(([url]) => String(url))).toStrictEqual([
      'https://example.com/openapi.json',
      'https://example.com/model.json',
    ])
    const state = parseHydrationState(element.querySelector('script[data-scalar-hydration]')!.textContent!)
    const clientDocument = state.client.documents['api-1']
    const referenceDocument = state.reference.documents['api-1']
    if (!isOpenApiDocument(clientDocument) || !isOpenApiDocument(referenceDocument)) {
      throw new Error('Expected OpenAPI documents in the server snapshot')
    }
    expect(clientDocument.servers).toStrictEqual(configuration.servers)
    expect(clientDocument['x-scalar-selected-server']).toBe('https://configured.example.com/{region}')
    expect(state.reference.meta['x-scalar-active-environment']).toBe('production')
    expect(state.client.meta['x-scalar-active-environment']).toBe('production')
    const externalSchemas = 'x-ext' in referenceDocument ? referenceDocument['x-ext'] : undefined
    expect(isObject(externalSchemas) ? Object.values(externalSchemas) : []).toStrictEqual([schema])

    const heading = element.querySelector('h1')
    const operation = element.querySelector('[id$="/GET/things"]')
    expect(operation).not.toBeNull()
    const browserFetch = vi.fn<typeof fetch>(() => Promise.reject(new Error('Browser is offline')))
    onLoaded.mockClear()
    onDocumentSelect.mockClear()
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()
    const reference = createApiReference(element, { ...configuration, customFetch: browserFetch })
    try {
      await flushPromises()
      await nextTick()
      expect(browserFetch.mock.calls).toStrictEqual([])
      expect(element.querySelector('h1')).toBe(heading)
      expect(operation?.isConnected).toBe(true)
      expect(onLoaded.mock.calls).toStrictEqual([['api-1']])
      expect(onDocumentSelect.mock.calls).toStrictEqual([[]])
      expect(hydrationMessages()).toStrictEqual([])

      reference.updateConfiguration({
        content: { ...content, info: { title: 'Updated snapshot API', version: '2.0.0' } },
        forceDarkModeState: 'light',
        customFetch: browserFetch,
        onLoaded,
        onDocumentSelect,
      })
      await flushPromises()
      await nextTick()
      expect(element.querySelector('h1')?.textContent).toBe('Updated snapshot API')
      expect(browserFetch.mock.calls).toStrictEqual([])
      expect(onLoaded.mock.calls).toStrictEqual([['api-1']])
    } finally {
      reference.destroy()
    }
  })
})
