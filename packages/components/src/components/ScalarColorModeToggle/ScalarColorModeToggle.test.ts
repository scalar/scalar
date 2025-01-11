import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarColorModeToggle from './ScalarColorModeToggle.vue'

describe('ScalarColorModeToggle', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScalarColorModeToggle)
    expect(wrapper.exists()).toBe(true)
  })

  // TODO: Add more tests
})
