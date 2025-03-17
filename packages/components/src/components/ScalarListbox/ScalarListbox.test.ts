import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarListbox from './ScalarListbox.vue'

describe('ScalarListbox', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarListbox, {
      props: {
        options: [
          { id: '1', label: 'Option 1' },
          { id: '2', label: 'Option 2' },
          { id: '3', label: 'Option 3' },
        ],
      },
      slots: {
        default: '<button>Button</button>',
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
