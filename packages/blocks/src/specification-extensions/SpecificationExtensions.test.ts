import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SpecificationExtensions from './SpecificationExtensions.vue'

describe('SpecificationExtensions', () => {
  it('displays names and values without type annotations', () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-scopes': ['read', 'write'], 'x-policy': { enabled: false } } },
    })
    expect(wrapper.findAll('dt').map((row) => row.text())).toStrictEqual([
      'x-scopes',
      'Array item [0]',
      'Array item [1]',
      'x-policy',
      'enabled:',
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

  it('gives sibling collection controls distinct accessible names', () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-rules': [{ role: 'admin' }, { role: 'reader' }] } },
    })
    const controls = wrapper.findAll('button').slice(1)
    expect(controls.map((button) => wrapper.get(`#${button.attributes('aria-labelledby')}`).text())).toStrictEqual([
      'Array item [0]',
      'Array item [1]',
    ])
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

  it('folds the values under an Extensions row when collapsible', async () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-owner': 'checkout', 'x-cost': { requests: 1 } }, collapsible: true },
    })
    const toggle = wrapper.get('button')
    expect(wrapper.text()).toBe('Extensions (2)')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBeUndefined()
    expect(wrapper.get(`#${toggle.attributes('aria-labelledby')}`).text()).toBe('Extensions (2)')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find(`#${toggle.attributes('aria-controls')}`).exists()).toBe(true)
    expect(wrapper.findAll('dt').map((row) => row.text())).toStrictEqual(['x-owner:', 'x-cost', 'requests:'])
    expect(wrapper.findAll('code').map((row) => row.text())).toStrictEqual(['"checkout"', '1'])
  })

  it('opens the folded values like the unfolded list: top-level collections open, deeper ones closed', async () => {
    const extensions = { 'x-limits': { daily: { requests: 100 } } }
    const folded = mount(SpecificationExtensions, { props: { extensions, collapsible: true } })
    const list = mount(SpecificationExtensions, { props: { extensions } })

    await folded.get('button').trigger('click')

    const rows = (wrapper: typeof list) => wrapper.findAll('dt').map((row) => row.text())
    expect(rows(folded)).toStrictEqual(['x-limits', 'daily'])
    expect(rows(folded)).toStrictEqual(rows(list))
    expect(folded.text()).not.toContain('requests')
  })

  it('closes the folded values again', async () => {
    const wrapper = mount(SpecificationExtensions, {
      props: { extensions: { 'x-owner': 'checkout' }, collapsible: true },
    })
    const toggle = wrapper.get('button')
    await toggle.trigger('click')
    expect(wrapper.text()).toContain('"checkout"')

    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(toggle.attributes('aria-controls')).toBeUndefined()
    expect(wrapper.text()).toBe('Extensions (1)')
  })

  it('renders nothing when collapsible and there are no extensions', () => {
    const wrapper = mount(SpecificationExtensions, { props: { extensions: {}, collapsible: true } })
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('button').exists()).toBe(false)
  })
})
