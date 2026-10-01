import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SpecificationExtensions from './SpecificationExtensions.vue'

describe('SpecificationExtensions', () => {
  it('displays typed rows for strings, arrays, and objects', () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-scopes': ['read', 'write'], 'x-policy': { enabled: false } } },
    })
    expect(wrapper.findAll('dt').map((row) => row.text())).toStrictEqual([
      'x-scopesarray[2]',
      '[0]string',
      '[1]string',
      'x-policyobject',
      'enabledboolean',
    ])
    expect(wrapper.findAll('code').map((row) => row.text())).toStrictEqual(['"read"', '"write"', 'false'])
  })

  it.each([
    [false, 'false'],
    [0, '0'],
    [null, 'null'],
    ['', '""'],
    [[], '[]'],
    [{}, '{}'],
  ])('preserves the value %j', (value, expected) => {
    const wrapper = mount(SpecificationExtensions, { props: { extensions: { 'x-value': value } } })
    expect(wrapper.get('code').text()).toBe(expected)
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('expands nested objects and arrays lazily with accessible disclosure controls', async () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-values': [{ roles: ['admin'] }] } },
    })
    const nested = wrapper.findAll('button')[1]!
    expect(nested.attributes('aria-expanded')).toBe('false')
    expect(nested.attributes('aria-controls')).toBeUndefined()
    expect(wrapper.text()).not.toContain('admin')
    await nested.trigger('click')
    expect(nested.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find(`#${nested.attributes('aria-controls')}`).exists()).toBe(true)
    await wrapper.findAll('button')[2]!.trigger('click')
    expect(wrapper.get('code').text()).toBe('"admin"')
    await wrapper.findAll('button')[0]!.trigger('click')
    expect(wrapper.find('code').exists()).toBe(false)
  })

  it('handles cycles without treating shared siblings as circular', async () => {
    const shared = { enabled: true }
    const value: Record<string, unknown> = { first: shared, second: shared }
    value.self = value
    const wrapper = mount(SpecificationExtensions, { props: { extensions: { 'x-policy': value } } })
    await wrapper.findAll('button')[1]!.trigger('click')
    await wrapper.findAll('button')[2]!.trigger('click')
    expect(wrapper.findAll('code').map((row) => row.text())).toStrictEqual(['true', 'true', '[Circular]'])
  })

  it('updates values and renders HTML-like strings as text', async () => {
    const wrapper = mount(SpecificationExtensions, { props: { extensions: { 'x-value': 'first' } } })
    await wrapper.setProps({ extensions: { 'x-value': '<img src=x onerror=alert(1)>' } })
    expect(wrapper.get('code').text()).toBe('"<img src=x onerror=alert(1)>"')
    expect(wrapper.find('img').exists()).toBe(false)
    await wrapper.setProps({ extensions: {} })
    expect(wrapper.text()).toBe('')
  })
})
