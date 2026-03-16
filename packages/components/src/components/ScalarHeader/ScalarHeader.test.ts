import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

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
