import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarModal, { useModal } from './ScalarModal.vue'

describe('ScalarIconButton', () => {
  it('renders properly', async () => {
    const state = useModal()
    const wrapper = mount(ScalarModal, {
      props: {
        state,
      },
    })

    // Wait for icon to load
    await flushPromises()

    expect(wrapper.html()).toBe(
      `<!--teleport start-->
<!--teleport end-->
<div style="position: fixed; height: 0px; padding: 0px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border-width: 0px; display: none;"></div>`,
    )
  })
})
