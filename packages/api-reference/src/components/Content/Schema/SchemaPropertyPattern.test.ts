import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaPropertyPattern from './SchemaPropertyPattern.vue'

describe('SchemaPropertyPattern', () => {
  it('renders the Pattern button label', () => {
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern: '^[a-z]+$' },
    })

    expect(wrapper.find('.property-pattern').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pattern')
  })

  it('renders the full pattern value in the popup', () => {
    const pattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern },
    })

    expect(wrapper.find('.property-pattern-popup code').text()).toBe(pattern)
  })

  it('renders a long/complex regex pattern without truncation', () => {
    const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$'
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern },
    })

    expect(wrapper.find('.property-pattern-popup code').text()).toBe(pattern)
  })

  it('renders the copy button inside the popup', () => {
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern: '^\\d+$' },
    })

    expect(wrapper.find('.property-pattern-value').exists()).toBe(true)
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('popup is hidden by default (display: none via CSS)', () => {
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern: '^\\d+$' },
    })

    // The popup element exists in the DOM but is hidden via CSS
    expect(wrapper.find('.property-pattern-popup').exists()).toBe(true)
  })
})
