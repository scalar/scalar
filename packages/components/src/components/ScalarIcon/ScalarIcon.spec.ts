import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarIcon from './ScalarIcon.vue'

describe('ScalarButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarIcon, { props: { icon: 'Logo' } })

    // Wait for icon to load
    await flushPromises()

    expect(wrapper.element.nodeName.toLowerCase()).toBe('svg')
  })
})
