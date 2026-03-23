import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ContextMenu from './ContextMenu.vue'

describe('ContextMenu', () => {
  it('renders properly', () => {
    const wrapper = mount(ContextMenu, {
      slots: {
        trigger: '<span>Right click here</span>',
        content: '<div>Context Menu Content</div>',
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
