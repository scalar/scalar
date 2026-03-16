import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vite-plus/test'

import ScalarFileUpload from './ScalarFileUpload.vue'

describe('ScalarFileUpload', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarFileUpload, {})
    expect(wrapper.exists()).toBeTruthy()
  })
})
