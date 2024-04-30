import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarDropdown from './ScalarDropdown.vue'

describe('ScalarDropdown', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarDropdown, {
      slots: {
        default: 'Hello Vitest',
      },
    })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
