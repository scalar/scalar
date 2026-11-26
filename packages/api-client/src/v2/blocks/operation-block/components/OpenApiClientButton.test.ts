import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'

import OpenApiClientButton from './OpenApiClientButton.vue'

describe('OpenApiClientButton', () => {
  it('preserves the server-rendered button while resolving the browser URL', async () => {
    const element = document.createElement('div')
    const props = { buttonSource: 'sidebar' as const }
    element.innerHTML = await renderToString(createSSRApp(OpenApiClientButton, props))
    const button = element.querySelector('a')
    expect(button?.textContent).toContain('Open API Client')
    expect(button?.getAttribute('href')).toBeNull()
    const app = createSSRApp(OpenApiClientButton, props)
    app.mount(element)
    await nextTick()
    expect(element.querySelector('a')).toBe(button)
    expect(new URL(button!.href).searchParams.get('url')).toBe(window.location.href)
    app.unmount()
  })

  it('adds operation_path and operation_method query params when provided', () => {
    const wrapper = mount(OpenApiClientButton, {
      props: {
        buttonSource: 'modal',
        url: 'https://example.com/openapi.json',
        operationPath: '/pets/{id}',
        operationMethod: 'GET',
      },
      attachTo: document.body,
    })

    const link = wrapper.get('a')
    const href = new URL(link.attributes('href')!)
    expect(href.searchParams.get('url')).toBe('https://example.com/openapi.json')
    expect(href.searchParams.get('operation_path')).toBe('/pets/{id}')
    expect(href.searchParams.get('operation_method')).toBe('get')
  })

  it.each(['COPY', 'copy', 'customMethod', 'pAtCh'])('preserves the custom method %s in the import link', (method) => {
    const wrapper = mount(OpenApiClientButton, {
      props: {
        buttonSource: 'modal',
        url: 'https://example.com/openapi.json',
        operationPath: '/pets',
        operationMethod: method,
      },
    })
    const href = new URL(wrapper.get('a').attributes('href')!)
    expect(href.searchParams.get('operation_method')).toBe(method)
  })

  it('does not add operation query params when path or method is missing', () => {
    const wrapper = mount(OpenApiClientButton, {
      props: {
        buttonSource: 'modal',
        url: 'https://example.com/openapi.json',
        operationPath: '/pets',
      },
      attachTo: document.body,
    })

    const href = new URL(wrapper.get('a').attributes('href')!)

    expect(href.searchParams.has('operation_path')).toBe(false)
    expect(href.searchParams.has('operation_method')).toBe(false)
  })
})
