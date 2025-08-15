import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import OpenApiVersion from './OpenApiVersion.vue'

describe('OpenApiVersion', () => {
  it('displays the OpenAPI version when provided', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: '3.1.0' },
    })

    expect(wrapper.text()).toContain('OAS 3.1.0')
  })

  it('displays different OpenAPI versions correctly', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: '2.0.0' },
    })

    expect(wrapper.text()).toContain('OAS 2.0.0')
  })

  it('does not render when version is undefined', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: undefined },
    })

    expect(wrapper.text()).toBe('')
  })

  it('does not render when version is empty string', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: '' },
    })

    expect(wrapper.text()).toBe('')
  })

  it('does not render when oasVersion prop is not provided', () => {
    const wrapper = mount(OpenApiVersion)

    expect(wrapper.text()).toBe('')
  })

  it('handles null version gracefully', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: null as any },
    })

    expect(wrapper.text()).toBe('')
  })

  it('renders Badge component when oasVersion is provided', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: '3.0.0' },
    })

    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('OAS 3.0.0')
  })

  it('does not render Badge component when oasVersion is falsy', () => {
    const wrapper = mount(OpenApiVersion, {
      props: { oasVersion: '' },
    })

    const badge = wrapper.findComponent({ name: 'Badge' })
    expect(badge.exists()).toBe(false)
  })
})
