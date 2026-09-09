import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSidebar from './ScalarSidebar.vue'

describe('ScalarSidebar', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScalarSidebar)
    expect(wrapper.exists()).toBe(true)
  })

  // TODO: Add more tests
})
