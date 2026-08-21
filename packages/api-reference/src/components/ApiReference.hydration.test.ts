import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

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

/**
 * Regression guard for https://github.com/scalar/scalar/issues/4458.
 *
 * We render the reference on the "server" with `renderToString`, then hydrate that
 * same markup on the client and listen for the warnings Vue emits when the two
 * renders disagree. Vue logs `Hydration completed but contains mismatches.` (plus a
 * detailed `[Vue warn]` per node in development builds) whenever hydration is not
 * clean, so any captured message means we shipped a mismatch.
 *
 * This is expected to fail until every SSR hydration mismatch in #4458 is resolved.
 */
it('hydrates the API reference without mismatches', async () => {
  // Pretend the visitor prefers dark mode, so the color-mode path is exercised.
  window.matchMedia = matchMediaMock(true)

  const html = await renderToString(createSSRApp({ render: () => h(ApiReference, { configuration }) }))

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.appendChild(container)

  // Capture the warnings/errors Vue emits while hydrating onto the server markup.
  const messages: string[] = []
  vi.spyOn(console, 'warn').mockImplementation((...args) => messages.push(toText(args)))
  vi.spyOn(console, 'error').mockImplementation((...args) => messages.push(toText(args)))

  const app = createSSRApp({ render: () => h(ApiReference, { configuration }) })
  app.mount(container)
  await flushPromises()
  await nextTick()

  const hydrationIssues = messages.filter((message) => message.toLowerCase().includes('hydration'))

  app.unmount()
  container.remove()

  expect(hydrationIssues, hydrationIssues.join('\n\n')).toEqual([])
})
