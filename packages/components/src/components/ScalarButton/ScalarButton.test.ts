import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarButton from './ScalarButton.vue'

describe('ScalarButton', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarButton, {
      slots: {
        default: 'Hello Vitest',
      },
    })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
