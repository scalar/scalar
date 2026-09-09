import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebar from './ScalarSidebar.vue'

describe('ScalarSidebar', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScalarSidebar)
    expect(wrapper.exists()).toBe(true)
  })

  it('renders sidebar content', () => {
    const wrapper = mount(ScalarSidebar, {
      slots: { default: '<nav aria-label="API navigation">Endpoints</nav>' },
    })

    expect(wrapper.text()).toBe('Endpoints')
    expect(wrapper.get('nav').attributes('aria-label')).toBe('API navigation')
  })

  it('forwards accessible attributes to the sidebar', () => {
    const wrapper = mount(ScalarSidebar, {
      attrs: { 'aria-label': 'API sidebar', 'aria-describedby': 'sidebar-help', tabindex: 0 },
    })

    expect(wrapper.attributes('aria-label')).toBe('API sidebar')
    expect(wrapper.attributes('aria-describedby')).toBe('sidebar-help')
    expect(wrapper.attributes('tabindex')).toBe('0')
  })
})
