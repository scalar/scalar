import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

import { createApiReference } from './html-api'

beforeEach(() => {
  // The test DOM has no layout, so a deep link has nothing to scroll.
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  document.body.innerHTML = ''
  window.history.replaceState({}, '', '/')
})

// Keep this separate from intentionally mismatched mounts: Vue logs its production hydration error only once.
describe('html-api hydration', () => {
  it.each(['modern', 'classic'] as const)('preserves server-rendered content with the %s layout', async (layout) => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      layout,
      content: {
        openapi: '3.1.0',
        info: { title: 'Hydration Test API', version: '1.0.0' },
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello',
              responses: { '200': { description: 'Hello' } },
            },
          },
        },
      },
    })
    const ssrApp = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
    ssrApp.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(ssrApp)
    document.body.append(element)
    const heading = element.querySelector('h1')
    expect(heading?.textContent).toContain('Hydration Test API')
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = createApiReference(element, config)
    try {
      // Check both the synchronous hydration and the asynchronous document initialization.
      expect(element.querySelector('h1')).toBe(heading)
      await flushPromises()
      await nextTick()
      expect(element.querySelector('h1')).toBe(heading)
      expect(element.textContent).toContain('Say hello')
      expect(element.querySelector('script[data-scalar-hydration]')).toBeNull()
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
    } finally {
      reference.destroy()
    }
  })
  /** Two tags, so the first one is opened by default and the second one stays closed. */
  const taggedDocument = {
    openapi: '3.1.0',
    info: { title: 'Tagged API', version: '1.0.0' },
    tags: [{ name: 'planets' }, { name: 'moons' }],
    paths: {
      '/planets': {
        get: { tags: ['planets'], summary: 'List planets', responses: { '200': { description: 'OK' } } },
      },
      '/moons': {
        get: { tags: ['moons'], summary: 'List moons', responses: { '200': { description: 'OK' } } },
      },
    },
  }

  /** Server-render the reference into the page, like an integration would. */
  const renderOnServer = async (configuration: Record<string, unknown>): Promise<HTMLElement> => {
    const app = createSSRApp({ render: () => h(ApiReference, { configuration }) })
    app.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(app)
    document.body.append(element)
    return element
  }

  const getHydrationMessages = (): string[] =>
    [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
      .flat()
      .map(String)
      .filter((message) => /hydration/i.test(message))

  /** The titles of the sidebar groups that are open. */
  const getOpenGroups = (element: HTMLElement): string[] =>
    [...element.querySelectorAll('aside button[aria-expanded="true"]')].map(
      (button) => button.textContent?.replace('Close Group - ', '').trim() ?? '',
    )

  it('keeps the first tag open while hydrating', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({ _integration: 'html', content: taggedDocument })
    const element = await renderOnServer(config)
    const serverElements = [...element.querySelectorAll('*')]
    expect(getOpenGroups(element)).toStrictEqual(['planets'])
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = createApiReference(element, config)
    try {
      // The first browser render must reuse every element the server sent.
      expect(serverElements.filter((node) => !node.isConnected).length).toBe(0)
      await flushPromises()
      await nextTick()
      expect(getOpenGroups(element)).toStrictEqual(['planets'])
      expect(getHydrationMessages()).toStrictEqual([])
    } finally {
      reference.destroy()
    }
  })

  it('keeps every tag open when all tags are opened by default and the URL names a target', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      defaultOpenAllTags: true,
      content: taggedDocument,
    })
    const element = await renderOnServer(config)
    expect(getOpenGroups(element)).toStrictEqual(['planets', 'moons'])
    window.history.replaceState({}, '', '/#tag/moons/GET/moons')

    const reference = createApiReference(element, config)
    try {
      await flushPromises()
      await nextTick()
      expect(getOpenGroups(element)).toStrictEqual(['planets', 'moons'])
    } finally {
      reference.destroy()
    }
  })

  it('opens the tag named in the URL instead of the first tag after hydration', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({ _integration: 'html', content: taggedDocument })
    const element = await renderOnServer(config)
    expect(getOpenGroups(element)).toStrictEqual(['planets'])
    window.history.replaceState({}, '', '/#tag/moons/GET/moons')
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = createApiReference(element, config)
    try {
      // Hydration still matches the server, which cannot see the URL fragment.
      expect(getOpenGroups(element)).toStrictEqual(['planets'])
      await flushPromises()
      await nextTick()
      expect(getOpenGroups(element)).toStrictEqual(['moons'])
      expect(getHydrationMessages()).toStrictEqual([])
    } finally {
      reference.destroy()
    }
  })

  it('leaves every tag closed when the first tag is not opened by default', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      defaultOpenFirstTag: false,
      content: taggedDocument,
    })
    const element = await renderOnServer(config)
    expect(getOpenGroups(element)).toStrictEqual([])
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = createApiReference(element, config)
    try {
      await flushPromises()
      await nextTick()
      expect(getOpenGroups(element)).toStrictEqual([])
      expect(getHydrationMessages()).toStrictEqual([])
    } finally {
      reference.destroy()
    }
  })

  it('selects the browser URL document after hydrating the server default', async () => {
    const config = {
      pathRouting: { basePath: '/reference' },
      sources: ['first', 'second'].map((slug) => ({
        slug,
        content: { openapi: '3.1.0', info: { title: `${slug} API`, version: '1.0.0' }, paths: {} },
      })),
    }
    const app = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
    app.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(app)
    document.body.append(element)
    const heading = element.querySelector('h1')
    expect(heading?.textContent).toContain('first API')
    window.history.replaceState({}, '', '/reference/second')

    const reference = createApiReference(element, config)
    try {
      expect(element.querySelector('h1')).toBe(heading)
      await flushPromises()
      await nextTick()
      expect(element.querySelector('h1')?.textContent).toContain('second API')
      expect(window.location.pathname).toContain('/reference/second')
    } finally {
      reference.destroy()
    }
  })

  it('loads normally when the embedded state contains invalid JSON', async () => {
    const config = { content: { openapi: '3.1.0', info: { title: 'Recovered API', version: '1.0.0' }, paths: {} } }
    const element = document.createElement('div')
    element.innerHTML = await renderToString(createSSRApp(ApiReference, { configuration: config }))
    element.querySelector('script[data-scalar-hydration]')!.textContent = '{invalid'
    document.body.append(element)
    const reference = createApiReference(element, config)
    try {
      await flushPromises()
      await nextTick()
      expect(element.querySelector('h1')?.textContent).toContain('Recovered API')
    } finally {
      reference.destroy()
    }
  })

  it('escapes embedded document state without changing the description', async () => {
    const title = '</script><script id="injected">alert(1)</script>&'
    const config = apiReferenceConfigurationWithSourceSchema({
      content: { openapi: '3.1.0', info: { title, version: '1.0.0' }, paths: {} },
    })
    const element = document.createElement('div')
    element.innerHTML = await renderToString(createSSRApp(ApiReference, { configuration: config }))
    const state = element.querySelector('script[data-scalar-hydration]')?.textContent
    expect(state).toBeDefined()
    expect(state).not.toContain('</script>')
    expect(element.querySelector('#injected')).toBeNull()
    const parsed = JSON.parse(state!)
    expect(parsed.reference.documents['api-1'].info.title).toBe(title)
    expect(parsed.reference.auth).toBeUndefined()
    expect(parsed.client.auth).toBeUndefined()
    expect(parsed.reference.intermediateDocuments).toBeUndefined()
    expect(parsed.client.documents['api-1'].info).toBeUndefined()
    expect(parsed.reference.originalDocuments['api-1'].info.title).toBe(title)
  })
})
