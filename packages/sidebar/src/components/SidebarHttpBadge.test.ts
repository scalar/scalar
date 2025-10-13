import { ScalarIconWebhooksLogo } from '@scalar/icons'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import HttpMethod from './HttpMethod.vue'
import SidebarHttpBadge from './SidebarHttpBadge.vue'

describe('SidebarHttpBadge', () => {
  it('renders with method prop', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'get' },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findComponent(HttpMethod).exists()).toBe(true)
  })

  it('passes method prop to HttpMethod component', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.props('method')).toBe('post')
  })

  it('applies short prop to HttpMethod component', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'put' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.props('short')).toBe(true)
  })

  it('applies property prop with --method-color to HttpMethod component', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'delete' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.props('property')).toBe('--method-color')
  })

  it('applies correct CSS classes for method', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'GET' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type')
    expect(httpMethod.classes()).toContain('sidebar-heading-type--get')
  })

  it('applies active class when active prop is true', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', active: true },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type-active')
  })

  it('does not apply active class when active prop is false', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', active: false },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).not.toContain('sidebar-heading-type-active')
  })

  it('does not apply active class when active prop is not provided', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).not.toContain('sidebar-heading-type-active')
  })

  it('renders webhook icon when webhook prop is true', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', webhook: true },
    })

    expect(wrapper.findComponent(ScalarIconWebhooksLogo).exists()).toBe(true)
  })

  it('does not render webhook icon when webhook prop is false', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', webhook: false },
    })

    expect(wrapper.findComponent(ScalarIconWebhooksLogo).exists()).toBe(false)
  })

  it('does not render webhook icon when webhook prop is not provided', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post' },
    })

    expect(wrapper.findComponent(ScalarIconWebhooksLogo).exists()).toBe(false)
  })

  it('applies bold weight to webhook icon', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'get', webhook: true },
    })

    const icon = wrapper.findComponent(ScalarIconWebhooksLogo)
    expect(icon.props('weight')).toBe('bold')
  })

  it('renders custom slot content when provided', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'get' },
      slots: {
        default: '<span class="custom-content">Custom Badge</span>',
      },
    })

    expect(wrapper.find('.custom-content').exists()).toBe(true)
    expect(wrapper.text()).toContain('Custom Badge')
  })

  it('does not render webhook icon when custom slot is provided', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', webhook: true },
      slots: {
        default: '<span>Custom Content</span>',
      },
    })

    // Custom slot overrides default webhook icon
    expect(wrapper.findComponent(ScalarIconWebhooksLogo).exists()).toBe(false)
    expect(wrapper.text()).toContain('Custom Content')
  })

  it('renders screen reader text for accessibility', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'get' },
    })

    const srOnly = wrapper.find('.sr-only')
    expect(srOnly.exists()).toBe(true)
    expect(srOnly.text()).toBe('HTTP Method:')
  })

  it('handles uppercase method names correctly in classes', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'POST' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type--post')
  })

  it('handles mixed case method names correctly in classes', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'PaTcH' },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type--patch')
  })

  it('applies all CSS classes simultaneously when active and method are set', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'delete', active: true },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type')
    expect(httpMethod.classes()).toContain('sidebar-heading-type--delete')
    expect(httpMethod.classes()).toContain('sidebar-heading-type-active')
  })

  it('handles all standard HTTP methods', () => {
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    methods.forEach((method) => {
      const wrapper = mount(SidebarHttpBadge, {
        props: { method },
      })

      const httpMethod = wrapper.findComponent(HttpMethod)
      expect(httpMethod.props('method')).toBe(method)
      expect(httpMethod.classes()).toContain(`sidebar-heading-type--${method}`)
    })
  })

  it('renders with webhook and active state combined', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: { method: 'post', webhook: true, active: true },
    })

    const httpMethod = wrapper.findComponent(HttpMethod)
    expect(httpMethod.classes()).toContain('sidebar-heading-type-active')
    expect(wrapper.findComponent(ScalarIconWebhooksLogo).exists()).toBe(true)
  })
})
