import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExternalDocs from './ExternalDocs.vue'

describe('ExternalDocs', () => {
  it('uses the description as the link label, falling back to the URL', async () => {
    const wrapper = mount(ExternalDocs, {
      props: { value: { url: 'https://example.com/guide', description: 'Guide' } },
    })
    expect(wrapper.get('a').text()).toBe('Guide')
    expect(wrapper.get('a').attributes('aria-label')).toBe('Guide')
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/guide')
    expect(wrapper.get('a').attributes('target')).toBe('_blank')
    await wrapper.setProps({ value: { url: 'https://example.com/guide' } })
    expect(wrapper.get('a').text()).toBe('https://example.com/guide')
    expect(wrapper.get('a').attributes('aria-label')).toBe('https://example.com/guide')
  })

  it('resolves chained documentation references', () => {
    const value = { $ref: '#/components/externalDocs/guide' }
    // The store attaches reference targets outside the serialized API description.
    Object.defineProperty(value, '$ref-value', {
      configurable: true,
      value: {
        $ref: '#/components/externalDocs/target',
        '$ref-value': { url: 'https://example.com/target', description: '*Target*' },
      },
    })
    const wrapper = mount(ExternalDocs, { props: { value } })
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/target')
    expect(wrapper.get('a').text()).toBe('*Target*')
  })

  it('omits unresolved documentation', () => {
    const wrapper = mount(ExternalDocs, { props: { value: { $ref: '#/missing' } } })
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('retains descriptions without linking unsafe URLs', () => {
    const wrapper = mount(ExternalDocs, {
      props: {
        value: {
          url: 'javascript:alert(1)',
          description: '**Useful** description',
        },
      },
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).toBe('**Useful** description')
  })
})
