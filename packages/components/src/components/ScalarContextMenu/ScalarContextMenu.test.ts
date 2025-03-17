import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarContextMenu from './ScalarContextMenu.vue'

describe('ScalarContextMenu', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarContextMenu, {
      props: {
        items: [
          { id: '1', label: 'Item 1' },
          { id: '2', label: 'Item 2' },
        ],
      },
      slots: {
        trigger: '<span>Right click here</span>',
        content: '<div>Context Menu Content</div>',
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
