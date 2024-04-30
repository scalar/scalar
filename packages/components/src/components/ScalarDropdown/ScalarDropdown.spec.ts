import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarDropdown from './ScalarDropdown.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarDropdown, {
      props: {},
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
