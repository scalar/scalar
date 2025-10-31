import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import LabelInput from './LabelInput.vue'

describe('LabelInput', () => {
  it('renders an input with the correct placeholder', () => {
    const wrapper = mount(LabelInput, {
      props: {
        modelValue: '',
      },
    })

    const input = wrapper.find('input')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Untitled Document')
  })

  it('updates the model value when the user types', async () => {
    const wrapper = mount(LabelInput, {
      props: {
        modelValue: '',
        'onUpdate:modelValue': (value: string) => wrapper.setProps({ modelValue: value }),
      },
    })

    const input = wrapper.find('input')
    await input.setValue('My Document')

    expect(wrapper.props('modelValue')).toBe('My Document')
  })
})
