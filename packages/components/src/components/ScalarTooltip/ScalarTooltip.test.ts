import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarTooltip from './ScalarTooltip.vue'

describe('ScalarTooltip', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarTooltip, {
      props: {},
      slots: {
        trigger: '<button>Button</button>',
        content: '<div>Tooltip Content</div>',
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
