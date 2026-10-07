import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ExternalDocumentation from './ExternalDocumentation.vue'

describe('ExternalDocumentation', () => {
  it('renders Markdown outside the documentation link', () => {
    const wrapper = mount(ExternalDocumentation, {
      props: {
        value: {
          url: 'https://example.com/guide',
          description: '**Guide** with [details](https://example.com/details)',
        },
      },
    })
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/guide')
    expect(wrapper.get('a').attributes('target')).toBe('_blank')
    expect(wrapper.get('strong').text()).toBe('Guide')
    expect(wrapper.findAll('a').map((link) => link.attributes('href'))).toStrictEqual([
      'https://example.com/guide',
      'https://example.com/details',
    ])
    expect(wrapper.find('a a').exists()).toBe(false)
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
    const wrapper = mount(ExternalDocumentation, { props: { value } })
    expect(wrapper.get('a').attributes('href')).toBe('https://example.com/target')
    expect(wrapper.get('em').text()).toBe('Target')
  })

  it('omits unresolved documentation', () => {
    const wrapper = mount(ExternalDocumentation, { props: { value: { $ref: '#/missing' } } })
    expect(wrapper.text()).toBe('')
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('retains descriptions without linking unsafe URLs', () => {
    const wrapper = mount(ExternalDocumentation, {
      props: {
        value: {
          url: 'javascript:alert(1)',
          description: '**Useful** description',
        },
      },
    })
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.get('strong').text()).toBe('Useful')
  })
})
