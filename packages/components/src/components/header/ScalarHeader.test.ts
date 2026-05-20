import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarHeader from './ScalarHeader.vue'

describe('ScalarHeader', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarHeader, {
      slots: {
        default: 'Hello Vitest',
      },
    })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
