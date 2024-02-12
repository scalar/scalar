import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarModal, { useModal } from './ScalarModal.vue'

describe('ScalarModal', () => {
  it('renders properly', async () => {
    const state = useModal()
    const wrapper = mount(ScalarModal, {
      props: {
        state,
      },
    })

    // Wait for modal to load
    await flushPromises()

    // Grab the first child div
    const el = wrapper.find('*').element as HTMLElement

    // Check some of the attributes
    expect(el.nodeName.toLowerCase()).toBe('div')
    expect(el.style.cssText).toBe(
      'position: fixed; height: 0px; padding: 0px; overflow: hidden; clip: rect(0px, 0px, 0px, 0px); white-space: nowrap; border-width: 0px; display: none;',
    )
  })
})
