import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarIcon from './ScalarIcon.vue'

describe('ScalarButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarIcon, { props: { icon: 'Logo' } })

    // Wait for icon to load
    await vi.dynamicImportSettled()

    expect(wrapper.element.nodeName.toLowerCase()).toBe('svg')
  })
})
