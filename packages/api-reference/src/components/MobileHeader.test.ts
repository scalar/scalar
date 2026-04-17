import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MobileHeader from './MobileHeader.vue'

describe('MobileHeader', () => {
  it('uses responsive desktop sidebar classes without hidden utility token', () => {
    const wrapper = mount(MobileHeader, {
      props: {
        breadcrumb: 'Users',
        isSidebarOpen: false,
        showSidebar: true,
      },
      slots: {
        sidebar: ({ sidebarClasses }: { sidebarClasses: string }) =>
          `<aside class="${sidebarClasses}">Sidebar</aside>`,
      },
    })

    const aside = wrapper.find('aside')
    expect(aside.exists()).toBe(true)
    expect(aside.classes()).toContain('max-lg:hidden')
    expect(aside.classes()).toContain('lg:flex')
    expect(aside.classes()).not.toContain('hidden')
  })
})
