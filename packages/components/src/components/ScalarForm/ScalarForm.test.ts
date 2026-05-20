import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ScalarForm from './ScalarForm.vue'

enableAutoUnmount(afterEach)

describe('ScalarForm', () => {
  it('renders correctly', () => {
    const wrapper = mount(ScalarForm)
    expect(wrapper.exists()).toBe(true)
  })

  it('emits the submit event', async () => {
    const onSubmit = vi.fn()
    const wrapper = mount(ScalarForm, {
      slots: { default: '<button type="submit">Submit</button>' },
      attrs: { onSubmit },
      attachTo: document.body,
    })

    expect(onSubmit).not.toHaveBeenCalled()

    const form = wrapper.find('form')
    await form.trigger('submit')

    expect(onSubmit).toHaveBeenCalled()
  })
})
