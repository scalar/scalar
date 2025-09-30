import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCheckboxInput from './ScalarCheckboxInput.vue'

describe('ScalarCheckboxInput', () => {
  it('renders properly', () => {
    const wrapper = mount(ScalarCheckboxInput)
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
  })

  it('binds v-model correctly', async () => {
    const wrapper = mount(ScalarCheckboxInput, {
      props: {
        modelValue: false,
        'onUpdate:modelValue': (e) => wrapper.setProps({ modelValue: e }),
      },
    })
    const checkbox = wrapper.find('input[type="checkbox"]')
    await checkbox.setValue(true)
    expect(wrapper.props('modelValue')).toBe(true)
  })

  it('passes through attributes to checkbox element', () => {
    const wrapper = mount(ScalarCheckboxInput, {
      attrs: {
        'data-testid': 'test-input',
      },
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    expect(checkbox.attributes('data-testid')).toBe('test-input')
  })
})
