import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarFileUpload from './ScalarFileUpload.vue'

describe('ScalarFileUpload', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarFileUpload, {})
    expect(wrapper.exists()).toBeTruthy()
  })
})
