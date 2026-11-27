import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebarSearchButton from './ScalarSidebarSearchButton.vue'

describe('ScalarSidebarSearchButton', () => {
  it('exposes a stable hook for the keyboard shortcut', () => {
    const wrapper = mount(ScalarSidebarSearchButton, {
      slots: { shortcut: 'K' },
    })

    expect(wrapper.find('.scalar-sidebar-search-shortcut kbd').text()).toBe('K')
  })

  it('leaves out the shortcut hint without a shortcut', () => {
    const wrapper = mount(ScalarSidebarSearchButton)

    expect(wrapper.find('.scalar-sidebar-search-shortcut').exists()).toBe(false)
  })
})
