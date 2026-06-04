import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'

import SearchButton from './SearchButton.vue'

/** Symbols used for the macOS and non-macOS keyboard shortcut */
const COMMAND_SYMBOL = '⌘'
const CONTROL_SYMBOL = '⌃'

/**
 * Overrides the reported platform so we can simulate a macOS client. The
 * platform is read through `navigator`, which is unavailable during real SSR.
 */
const setUserAgent = (userAgent: string) =>
  Object.defineProperty(window.navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  })

const originalUserAgent = window.navigator.userAgent

afterEach(() => setUserAgent(originalUserAgent))

const props = { eventBus: createWorkspaceEventBus(), document: undefined }

/**
 * The server has no `navigator`, so it always renders the non-macOS shortcut.
 * If the client picked the shortcut from `navigator` during its first render,
 * a macOS visitor would render `⌘` where the server sent `⌃`, which is exactly
 * the hydration mismatch reported in the issue. The platform must therefore not
 * influence the server-rendered markup.
 */
it('renders a platform-independent shortcut on the server', async () => {
  // Pretend we are on macOS while producing the "server" markup.
  setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')

  const html = await renderToString(createSSRApp({ render: () => h(SearchButton, props) }))

  expect(html).toContain(CONTROL_SYMBOL)
  expect(html).not.toContain(COMMAND_SYMBOL)
})

/**
 * Once mounted on the client, the macOS shortcut is resolved so the symbol is
 * still correct for the user, just applied after hydration rather than during it.
 */
it('upgrades to the macOS shortcut after mounting on a macOS client', async () => {
  const html = await renderToString(createSSRApp({ render: () => h(SearchButton, props) }))

  setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')

  const container = document.createElement('div')
  container.innerHTML = html

  const app = createSSRApp({ render: () => h(SearchButton, props) })
  app.mount(container)
  await flushPromises()

  expect(container.textContent).toContain(COMMAND_SYMBOL)

  app.unmount()
})
