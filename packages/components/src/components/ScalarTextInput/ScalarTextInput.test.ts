import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import ScalarTextInput from './ScalarTextInput.vue'

describe('ScalarTextInput', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarTextInput)
    expect(wrapper.find('input').exists()).toBe(true)
  })

  it('binds v-model correctly', async () => {
    const wrapper = mount(ScalarTextInput, {
      props: {
        modelValue: 'initial',
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    })

    const input = wrapper.find('input')
    await input.setValue('new value')
    expect(wrapper.props('modelValue')).toBe('new value')
  })

  it('passes through attributes to input element', () => {
    const wrapper = mount(ScalarTextInput, {
      attrs: {
        placeholder: 'Enter text',
        'data-testid': 'test-input',
        type: 'email',
      },
    })

    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('Enter text')
    expect(input.attributes('data-testid')).toBe('test-input')
    expect(input.attributes('type')).toBe('email')
  })

  it('emits events from the input element', async () => {
    const onBlur = vi.fn()
    const wrapper = mount(ScalarTextInput, {
      attrs: {
        onBlur,
      },
    })

    const input = wrapper.find('input')
    await input.trigger('blur')
    expect(onBlur).toHaveBeenCalled()
  })

  it('focuses input when container is clicked', async () => {
    const wrapper = mount(ScalarTextInput)
    const container = wrapper.find('div')
    const input = wrapper.find('input')

    // Mock focus method
    const focusSpy = vi.spyOn(input.element, 'focus')

    await container.trigger('click')
    expect(focusSpy).toHaveBeenCalled()
  })

  it('autofocuses input when autofocus attribute is present', async () => {
    // Mock focus method before mounting
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const wrapper = mount(ScalarTextInput, {
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

    const wrapper = mount(ScalarTextInput)

    // Wait for mounted hook
    await wrapper.vm.$nextTick()

    expect(focusSpy).not.toHaveBeenCalled()
  })
})
