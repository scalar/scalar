import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarTextField from './ScalarTextField.vue'

describe('ScalarIconButton', () => {
  it('renders an input', async () => {
    const wrapper = mount(ScalarTextField)

    // Wait for icon to load
    await flushPromises()

    expect(wrapper.find('input').exists()).toBeTruthy()
  })
})
