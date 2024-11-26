import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCombobox from './ScalarCombobox.vue'

describe('ScalarCombobox', () => {
  it('renders properly', async () => {
    const wrapper = mount(ScalarCombobox, {
      props: {
        options: [
          { id: '1', label: 'Option 1' },
          { id: '2', label: 'Option 2' },
          { id: '3', label: 'Option 3' },
        ],
      },
      slots: {
        default: `<button>Button</button>`,
        before: `<div>Before</div>`,
        after: `<div>After</div>`,
      },
    })

    expect(wrapper.exists()).toBeTruthy()
  })
})
