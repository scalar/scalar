import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OpenApiClientButton from './OpenApiClientButton.vue'

describe('OpenApiClientButton', () => {
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
