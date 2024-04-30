import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarFloating from './ScalarFloating.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarFloating, {
      props: {},
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
