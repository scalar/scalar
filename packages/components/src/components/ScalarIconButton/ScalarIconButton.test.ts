import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarIconButton from './ScalarIconButton.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarIconButton, {
      props: { label: 'Logo button', icon: 'Logo' },
    })

    expect(wrapper.element.nodeName.toLowerCase()).toBe('button')
    expect(wrapper.find('svg').exists()).toBeTruthy()
  })
})
