import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExtensionValue from './ExtensionValue.vue'

describe('ExtensionValue', () => {
  it.each([
    [false, 'false'],
    [0, '0'],
    [null, 'null'],
    ['', ''],
    [[], '[]'],
    [{}, '{}'],
    [{ owner: ['team'] }, '{\n  "owner": [\n    "team"\n  ]\n}'],
    [[{ role: 'admin' }], '[\n  {\n    "role": "admin"\n  }\n]'],
  ])('displays %j without losing its value', (value, expected) => {
    expect(mount(ExtensionValue, { props: { value } }).text()).toBe(expected)
  })

  it('displays primitive array values as list items', () => {
    const wrapper = mount(ExtensionValue, { props: { value: ['read', false, 0, null] } })
    expect(wrapper.findAll('li').map((node) => node.text())).toStrictEqual(['read', 'false', '0', 'null'])
  })

  it('renders HTML-like strings as text', () => {
    const value = '<img src=x onerror=alert(1)>'
    const wrapper = mount(ExtensionValue, { props: { value } })
    expect(wrapper.text()).toBe(value)
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('handles circular objects from resolved API descriptions', () => {
    const value: Record<string, unknown> = {}
    value.self = value
    expect(mount(ExtensionValue, { props: { value } }).text()).toBe('{\n  "self": "[Circular]"\n}')
  })
})
