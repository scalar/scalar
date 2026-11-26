import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { renderToString } from '@vue/server-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import Lazy from './Lazy.vue'

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('Lazy hydration', () => {
  it('keeps server-rendered content before the intersection observer runs', async () => {
    const createApp = () =>
      createSSRApp({ render: () => h(Lazy, { id: 'hydrated-section' }, () => h('p', 'Rendered on the server')) })
    vi.stubGlobal('window', undefined)
    const html = await renderToString(createApp())
    vi.unstubAllGlobals()
    const element = document.createElement('div')
    element.innerHTML = html
    document.body.append(element)
    const paragraph = element.querySelector('p')
    expect(paragraph?.textContent).toBe('Rendered on the server')
    consoleWarnSpy.mockClear()
    consoleErrorSpy.mockClear()

    const app = createApp()
    try {
      app.mount(element)
      expect(element.querySelector('p')).toBe(paragraph)
      await nextTick()
      expect(element.querySelector('p')).toBe(paragraph)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    } finally {
      app.unmount()
    }
  })
})
