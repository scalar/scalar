import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarTextArea from './ScalarTextArea.vue'

describe('ScalarTextArea', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarTextArea)
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('binds v-model correctly', async () => {
    const wrapper = mount(ScalarTextArea, {
      props: {
        modelValue: 'initial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    })

    const textarea = wrapper.find('textarea')
    await textarea.setValue('new value')
    expect(wrapper.props('modelValue')).toBe('new value')
  })

  it('passes through attributes to textarea element', () => {
    const wrapper = mount(ScalarTextArea, {
      attrs: {
        placeholder: 'Enter text',
        'data-testid': 'test-input',
        type: 'email',
      },
    })

    const textarea = wrapper.find('textarea')
    expect(textarea.attributes('placeholder')).toBe('Enter text')
    expect(textarea.attributes('data-testid')).toBe('test-input')
    expect(textarea.attributes('type')).toBe('email')
  })

  it('focuses textarea when container is clicked', async () => {
    const wrapper = mount(ScalarTextArea)
    const container = wrapper.find('div')
    const textarea = wrapper.find('textarea')

    // Mock focus method
    const focusSpy = vi.spyOn(textarea.element, 'focus')

    await container.trigger('click')
    expect(focusSpy).toHaveBeenCalled()
  })

  it('autofocuses input when autofocus attribute is present', async () => {
    // Mock focus method before mounting
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const wrapper = mount(ScalarTextArea, {
      attrs: {
        autofocus: true,
      },
    })

    // Wait for mounted hook
    await wrapper.vm.$nextTick()

    expect(focusSpy).toHaveBeenCalled()
  })

  it('does not autofocus input when autofocus attribute is absent', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const wrapper = mount(ScalarTextArea)

    // Wait for mounted hook
    await wrapper.vm.$nextTick()

    expect(focusSpy).not.toHaveBeenCalled()
  })
})
