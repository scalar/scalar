import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import SsrTakeover from '@/components/SsrTakeover.vue'

/**
 * A small, self-contained document so the test does not depend on the network.
 */
const configuration = {
  content: {
    openapi: '3.1.0',
    info: { title: 'Hydration Test API', version: '1.0.0' },
    paths: {
      '/things': {
        get: {
          summary: 'List things',
          responses: { '200': { description: 'OK' } },
        },
      },
    },
  },
}

/** A `matchMedia` stub (jsdom does not implement it) reporting a dark preference. */
const matchMediaMock = (matches: boolean) =>
  ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }) as unknown as MediaQueryList) as typeof window.matchMedia

/** Vue passes a Symbol for empty vnodes, so stringify each argument defensively. */
const toText = (args: unknown[]) =>
  args.map((arg) => (typeof arg === 'symbol' ? arg.toString() : String(arg))).join(' ')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SsrTakeover', () => {
  /**
   * Guards the fix for https://github.com/scalar/scalar/issues/4458.
   *
   * The server renders the full reference for SEO. The client re-uses that markup as an
   * opaque `v-html` node so hydration is clean (Vue does not compare the children of a
   * `v-html` element), then swaps in the interactive reference once its document loads.
   */
  it('hydrates server content without mismatches and takes over interactively', async () => {
    window.matchMedia = matchMediaMock(true)

    // The server renders the live reference (ssrHtml defaults to null).
    const serverHtml = await renderToString(createSSRApp({ render: () => h(SsrTakeover, { configuration }) }))

    const container = document.createElement('div')
    container.innerHTML = serverHtml
    document.body.appendChild(container)

    // The server really rendered the document (SEO), inside the takeover host.
    const host = container.querySelector('.scalar-ssr-takeover')
    const ssrHtml = host?.innerHTML ?? ''
    expect(ssrHtml).toContain('List things')

    // Capture the warnings/errors Vue emits while hydrating onto the server markup.
    const messages: string[] = []
    vi.spyOn(console, 'warn').mockImplementation((...args) => messages.push(toText(args)))
    vi.spyOn(console, 'error').mockImplementation((...args) => messages.push(toText(args)))

    // The client hydrates, re-using the server HTML it was shipped (read from the DOM).
    const app = createSSRApp({ render: () => h(SsrTakeover, { configuration, ssrHtml }) })
    app.mount(container)

    // Immediately after hydration the server content is preserved (no skeleton flash).
    expect(container.innerHTML).toContain('List things')

    await flushPromises()
    await nextTick()
    await flushPromises()

    const hydrationIssues = messages.filter((message) => message.toLowerCase().includes('hydration'))

    // Once the live reference has loaded we reveal it and drop the frozen snapshot.
    const frozenSnapshotRemoved = container.querySelector('.scalar-ssr-frozen') === null
    const stillInteractive = container.innerHTML.includes('List things')

    app.unmount()
    container.remove()

    expect(hydrationIssues, hydrationIssues.join('\n\n')).toEqual([])
    expect(frozenSnapshotRemoved).toBe(true)
    expect(stillInteractive).toBe(true)
  })
})
