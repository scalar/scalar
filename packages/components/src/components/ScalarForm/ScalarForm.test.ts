import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarForm from './ScalarForm.vue'

describe('ScalarForm', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScalarForm)
    expect(wrapper.exists()).toBe(true)
  })

  it('emits the submit event', async () => {
    const wrapper = mount(ScalarForm, {
      slots: { default: '<button type="submit">Submit</button>' },
      // Needs to be attached to document.body to trigger the submit event
      attachTo: document.body,
    })

    expect(wrapper.emitted()).not.toHaveProperty('submit')

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted()).toHaveProperty('submit')

    wrapper.unmount()
  })
})
