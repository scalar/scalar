import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarComboboxPopover from './ScalarComboboxPopover.vue'

describe('ScalarComboboxPopover', () => {
  it('handles keyboard events correctly', async () => {
    const wrapper = mount(ScalarComboboxPopover, {
      slots: {
        default: '<button>Toggle</button>',
        popover: '<div test-id="popover-content">Popover Content</div>',
      },
    })

    const button = wrapper.find('button')
    await button.trigger('keydown', { key: 'ArrowDown' })

    // Check that the popover content exists instead of the wrapper
    expect(wrapper.find('[test-id="popover-content"]').exists()).toBeTruthy()
  })
})
