import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarPopover from './ScalarPopover.vue'

describe('ScalarPopover', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarPopover, {
      props: {},
      slots: {
        default: `<button>Button</button>`,
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
