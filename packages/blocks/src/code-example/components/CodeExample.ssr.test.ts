import { afterEach, describe, expect, it, vi } from 'vitest'
import { type Component, createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { mockEventBus } from '../test-utils'
import CodeExample from './CodeExample.vue'

/** Builds an app that renders an operation whose request body has named examples. */
const createCodeExampleApp = (component: Component = CodeExample) =>
  createSSRApp({
    render: () =>
      h(component, {
        eventBus: mockEventBus,
        method: 'post',
        path: '/planets',
        clientOptions: [
          {
            label: 'Shell',
            key: 'shell',
            options: [
              {
                id: 'shell/curl',
                label: 'Curl',
                lang: 'curl',
                title: 'Shell Curl',
                targetKey: 'shell',
                targetTitle: 'Shell',
                clientKey: 'curl',
              },
            ],
          },
        ],
        selectedClient: 'shell/curl',
        selectedServer: { url: 'https://example.com' },
        securitySchemes: [],
        operation: {
          summary: 'Create a planet',
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
      }),
  })

/** Server-renders the operation. */
const renderCodeExample = (): Promise<string> => renderToString(createCodeExampleApp())

/** The snippet the shell/curl generator produces for the operation */
const CURL_SNIPPET = 'curl https://example.com/planets'

/** Collects Vue's hydration warnings and mismatch errors */
const spyOnHydrationMismatches = () => {
  const warn = vi.spyOn(console, 'warn')
  const error = vi.spyOn(console, 'error')
  return (): string[] =>
    [...warn.mock.calls, ...error.mock.calls].map((call) => String(call[0])).filter((m) => /hydration/i.test(m))
}

afterEach(() => {
  vi.restoreAllMocks()
})

/**
 * Lifecycle hooks such as `onBeforeMount` do not run on the server. An initial example chosen
 * there is missing from the server markup, so the browser's first render disagrees with it.
 */
describe('CodeExample.ssr', () => {
  it('renders the first request example on the server', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderCodeExample()

    expect(container.querySelector('[data-testid="example-picker"]')?.textContent?.trim()).toBe('Mars')
  })

  it('waits for the generator and renders the generated snippet on the server', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderCodeExample()

    expect(container.querySelector('.code-snippet')?.textContent).toContain(CURL_SNIPPET)
    expect(container.textContent).not.toMatch(/not loaded|no snippet found/i)
  })

  it('hydrates without a mismatch when the selected client is preloaded', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderCodeExample()
    const { preloadClients } = await import('@scalar/snippetz/lazy')
    await preloadClients(['shell/curl'])

    const getMismatches = spyOnHydrationMismatches()
    createCodeExampleApp().mount(container)

    expect(getMismatches()).toStrictEqual([])
    expect(container.querySelector('.code-snippet')?.textContent).toContain(CURL_SNIPPET)
  })

  it('keeps the server snippet without a mismatch when hydrating before the generator loads', async () => {
    const container = document.createElement('div')
    container.innerHTML = await renderCodeExample()

    // A fresh module graph has an empty generator cache, like a browser that did not preload
    vi.resetModules()
    const { getLoadedPlugin } = await import('@scalar/snippetz/lazy')
    const { default: FreshCodeExample } = await import('./CodeExample.vue')
    expect(getLoadedPlugin('shell', 'curl')).toBeUndefined()

    const getMismatches = spyOnHydrationMismatches()
    createCodeExampleApp(FreshCodeExample).mount(container)

    expect(getMismatches()).toStrictEqual([])
    expect(container.querySelector('.code-snippet')?.textContent).toContain(CURL_SNIPPET)

    // Once the generator arrives, the live snippet replaces the server markup
    await vi.waitFor(() => expect(getLoadedPlugin('shell', 'curl')).toBeDefined())
    await vi.waitFor(() => expect(container.querySelector('.code-snippet pre, .code-snippet code')).not.toBeNull())
    expect(container.querySelectorAll('.code-snippet')).toHaveLength(1)
    expect(container.querySelector('.code-snippet')?.textContent).toContain(CURL_SNIPPET)
    expect(getMismatches()).toStrictEqual([])
  })

  it('renders the placeholder on the server when the generator fails to load', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    // A fresh module graph whose generator import fails, like a server that lost a chunk
    vi.resetModules()
    vi.doMock('@scalar/snippetz/lazy', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@scalar/snippetz/lazy')>()
      return { ...actual, loadPlugin: () => Promise.reject(new Error('Failed to load the generator')) }
    })

    try {
      const { default: FreshCodeExample } = await import('./CodeExample.vue')
      const container = document.createElement('div')
      // Resolves rather than rejecting or waiting forever, so one broken chunk never takes the page down
      container.innerHTML = await renderToString(createCodeExampleApp(FreshCodeExample))

      // The browser cannot know the server failed, so its first render is the loading placeholder. The
      // server renders the same, so hydration matches and the browser loads the generator itself.
      const snippet = container.querySelector('.code-snippet')
      expect(snippet).not.toBeNull()
      expect(snippet?.childElementCount).toBe(0)
      expect(container.querySelector('[role="status"]')).toBeNull()
      expect(container.textContent).not.toMatch(/not loaded|no snippet found|error generating/i)
    } finally {
      vi.doUnmock('@scalar/snippetz/lazy')
    }
  })
})
