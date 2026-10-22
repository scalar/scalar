import { consoleErrorSpy, consoleWarnSpy } from '@scalar/helpers/testing/console-spies'
import { apiReferenceConfigurationWithSourceSchema } from '@scalar/schemas/api-reference'
import { renderToString } from '@vue/server-renderer'
import { flushPromises } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'

import ApiReference from '@/components/ApiReference.vue'

import { createApiReference } from './html-api'

afterEach(() => {
  document.body.innerHTML = ''
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
      const hydrationMessages = [...consoleWarnSpy.mock.calls, ...consoleErrorSpy.mock.calls]
        .flat()
        .map(String)
        .filter((message) => /hydration/i.test(message))
      expect(hydrationMessages).toStrictEqual([])
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
    expect(parsed.reference.auth).toStrictEqual({})
    expect(parsed.client.auth).toStrictEqual({})
  })
})
