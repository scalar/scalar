import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarSearchInput from './ScalarSearchInput.vue'

describe('ScalarButton', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarSearchInput)
    expect(wrapper.find('input')).toBeDefined()
  })
})
