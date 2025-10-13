import { getHttpMethodInfo } from '@scalar/helpers/http/http-info'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HttpMethod from './HttpMethod.vue'

describe('HttpMethod.vue', () => {
  it('renders default element as span', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: 'get' },
    })

    expect(wrapper.element.tagName).toBe('SPAN')
    // Uses normalized method when short is false
    expect(wrapper.text()).toBe('get')
  })

  it('renders using provided tag via "as" prop', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: 'post', as: 'p' },
    })

    expect(wrapper.element.tagName).toBe('P')
  })

  it('applies color style to custom CSS property when provided', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: 'put', property: '--http-color' },
    })

    const expected = getHttpMethodInfo('put').colorVar
    const value = (wrapper.element as HTMLElement).style.getPropertyValue('--http-color')
    expect(value).toBe(expected)
  })

  it('renders short label when short is true', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: 'patch', short: true },
    })

    expect(wrapper.text()).toBe(getHttpMethodInfo('patch').short)
  })

  it('renders slot content before the method label', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: 'delete' },
      slots: { default: 'Users: ' },
    })

    expect(wrapper.text().startsWith('Users: ')).toBe(true)
    expect(wrapper.text().endsWith('delete')).toBe(true)
  })

  it('normalizes casing and whitespace of method names', () => {
    const wrapper = mount(HttpMethod, {
      props: { method: '  PoSt  ' },
    })

    expect(wrapper.text()).toBe('post')
  })

  it('handles unknown method: short shows fallback, normalized shows default', () => {
    // When short is true, component uses getHttpMethodInfo(...).short which becomes "unknown"
    const shortWrapper = mount(HttpMethod, {
      props: { method: 'foo', short: true },
    })
    expect(shortWrapper.text()).toBe('foo')

    // When short is false, component uses normalizeHttpMethod which returns default "get"
    const normalizedWrapper = mount(HttpMethod, {
      props: { method: 'FOO' },
    })
    expect(normalizedWrapper.text()).toBe('get')
  })
})
