import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'
import { firstLazyLoadComplete } from '@/helpers/lazy-bus'

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
  it('hydrates a second mount in the same document after the first finished loading', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      content: {
        openapi: '3.1.0',
        info: { title: 'Remount API', version: '1.0.0' },
        paths: {
          '/hello': { get: { summary: 'Say hello', responses: { '200': { description: 'Hello' } } } },
        },
      },
    })
    // A server process starts with the lazy bus untouched.
    firstLazyLoadComplete.value = false
    const ssrApp = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
    ssrApp.config.idPrefix = 'scalar-refs'
    const serverHtml = await renderToString(ssrApp)
    const element = document.createElement('div')
    element.innerHTML = serverHtml
    document.body.append(element)

    // The first instance finishes its lazy load, which sets the shared flag.
    const first = createApiReference(element, config)
    await vi.waitFor(() => expect(firstLazyLoadComplete.value).toBe(true))
    first.destroy()

    // Client-side navigation brings the same server HTML back and mounts again.
    element.innerHTML = serverHtml
    const heading = element.querySelector('h1')
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()
    const second = createApiReference(element, config)
    try {
      expect(element.querySelector('h1')).toBe(heading)
      await flushPromises()
      await nextTick()
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
      // Once mounted, the second instance follows the shared flag and drops the placeholder.
      expect(element.querySelector('.references-container > .h-dvh')).toBeNull()
    } finally {
      second.destroy()
    }
  })

  it('waits for a lazy locale before hydrating server-rendered translations', async () => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      localization: { locale: 'de' },
      content: {
        openapi: '3.1.0',
        info: { title: 'Localized API', version: '1.0.0' },
        paths: {
          '/hello': { get: { summary: 'Say hello', responses: { '200': { description: 'Hello' } } } },
        },
      },
    })
    // The server waits for German on its own (serverPrefetch), so the markup is already translated.
    const ssrApp = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
    ssrApp.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(ssrApp)
    document.body.append(element)
    expect(element.textContent).toContain('Client-Bibliotheken')
    expect(element.textContent).not.toContain('Client Libraries')

    // A browser starts without any lazy locale, like a fresh page load.
    vi.resetModules()
    const browser = await import('./html-api')
    const { isLocaleLoaded } = await import('@scalar/localization')
    expect(isLocaleLoaded('de')).toBe(false)

    const heading = element.querySelector('h1')
    // The sidebar link the server rendered in German, which hydration must adopt rather than replace.
    const sidebarLink = [...element.querySelectorAll('aside *')].find((node) => node.textContent === 'Einführung')
    expect(sidebarLink).toBeDefined()
    let renderedEnglish = false
    const observer = new MutationObserver(() => {
      renderedEnglish ||= element.textContent?.includes('Client Libraries') ?? false
    })
    observer.observe(element, { subtree: true, childList: true, characterData: true })
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = browser.createApiReference(element, config)
    try {
      await vi.waitFor(() => expect(isLocaleLoaded('de')).toBe(true))
      await flushPromises()
      await nextTick()
      expect(renderedEnglish).toBe(false)
      expect(element.querySelector('h1')).toBe(heading)
      expect(sidebarLink?.isConnected).toBe(true)
      expect(sidebarLink?.textContent).toBe('Einführung')
      expect(element.textContent).toContain('Client-Bibliotheken')
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
    } finally {
      observer.disconnect()
      reference.destroy()
    }
  })

  it.each([
    ['a fenced code block', '```python\ndef greet(name):\n    return name\n```', 'code.language-python'],
    // The Markdown renderer keeps raw HTML code blocks, so their languages count too
    [
      'a raw HTML code block',
      '<pre><code class="language-ruby">def greet\n  1\nend</code></pre>',
      'code.language-ruby',
    ],
  ])('waits for the grammars of server-rendered code in %s before hydrating', async (_, description, selector) => {
    const config = apiReferenceConfigurationWithSourceSchema({
      _integration: 'html',
      content: {
        openapi: '3.1.0',
        info: { title: 'Highlighted API', version: '1.0.0', description },
        paths: {},
      },
    })
    // The server waits for the grammar on its own (serverPrefetch), so the markup is highlighted.
    const ssrApp = createSSRApp({ render: () => h(ApiReference, { configuration: config }) })
    ssrApp.config.idPrefix = 'scalar-refs'
    const element = document.createElement('div')
    element.innerHTML = await renderToString(ssrApp)
    document.body.append(element)
    const isHighlighted = (): boolean => element.querySelector(selector)?.querySelector('[class^="hljs-"]') !== null
    expect(element.querySelector(selector)).not.toBeNull()
    expect(isHighlighted()).toBe(true)

    // A browser starts without any grammar, like a fresh page load.
    vi.resetModules()
    const browser = await import('./html-api')

    let renderedPlain = false
    const observer = new MutationObserver(() => {
      renderedPlain ||= !isHighlighted()
    })
    observer.observe(element, { subtree: true, childList: true, characterData: true })
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const reference = browser.createApiReference(element, config)
    try {
      // Hydration waits for the grammar rather than mounting straight away
      const isMounted = (): boolean => '__vue_app__' in element
      expect(isMounted()).toBe(false)
      await vi.waitFor(() => expect(isMounted()).toBe(true))
      await flushPromises()
      await nextTick()
      expect(renderedPlain).toBe(false)
      expect(isHighlighted()).toBe(true)
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
    } finally {
      observer.disconnect()
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
