import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarIconButton from './ScalarIconButton.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarIconButton, {
      props: { label: 'Logo button', icon: 'Logo' },
    })

    // Wait for icon to load
    await vi.dynamicImportSettled()

    expect(wrapper.element.nodeName.toLowerCase()).toBe('button')
    expect(wrapper.find('svg').exists()).toBeTruthy()
  })
})
