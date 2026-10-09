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

  it('gives the copy button an accessible label that includes the pattern', () => {
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern: '^\\d+$' },
    })

    // The pattern is part of the label so screen readers announce the value,
    // not just the copy action (the raw regex inside the button is otherwise
    // not exposed as accessible text).
    expect(wrapper.find('.property-pattern-value').attributes('aria-label')).toBe('Copy pattern: ^\\d+$')
  })

  it('always renders the popup element in the DOM', () => {
    const wrapper = mount(SchemaPropertyPattern, {
      props: { pattern: '^\\d+$' },
    })

    // The popup is always present and toggled purely via CSS (hover/focus-within).
    // Its actual visibility is covered by the Playwright e2e tests, since jsdom
    // does not apply the scoped stylesheet.
    expect(wrapper.find('.property-pattern-popup').exists()).toBe(true)
  })
})
