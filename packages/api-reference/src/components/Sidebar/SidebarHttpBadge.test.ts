import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import SidebarHttpBadge from './SidebarHttpBadge.vue'

describe('SidebarHttpBadge', () => {
  it('adds the correct method class', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: {
        method: 'GET',
      },
    })

    expect(wrapper.classes()).toContain('sidebar-heading-type--get')
  })

  it('handles different HTTP methods', () => {
    const methods = ['POST', 'PUT', 'DELETE', 'PATCH']

    methods.forEach((method) => {
      const wrapper = mount(SidebarHttpBadge, {
        props: {
          method,
        },
      })

      expect(wrapper.classes()).toContain(`sidebar-heading-type--${method.toLowerCase()}`)
    })
  })

  it('adds active class when active prop is true', () => {
    const wrapper = mount(SidebarHttpBadge, {
      props: {
        method: 'GET',
        active: true,
      },
    })

    expect(wrapper.classes()).toContain('sidebar-heading-type-active')
  })
})
