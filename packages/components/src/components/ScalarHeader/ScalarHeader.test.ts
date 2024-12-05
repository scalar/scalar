import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarHeaderButton from './ScalarHeaderButton.vue'

describe('ScalarHeader', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarHeaderButton, {
      slots: {
        default: 'Hello Vitest',
      },
    })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
