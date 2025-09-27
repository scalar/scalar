import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCheckboxRadioGroup from './ScalarCheckboxRadioGroup.vue'

const options = [
  { label: 'One', value: 'one' },
  { label: 'Two', value: 'two' },
] as const

describe('ScalarCheckboxRadioGroup', () => {
  it('renders a radio for each option', () => {
    const wrapper = mount(ScalarCheckboxRadioGroup, {
      props: { options: [...options] },
    })

    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios.length).toBe(options.length)
  })

  it('binds v-model to selected option', async () => {
    const wrapper = mount(ScalarCheckboxRadioGroup, {
      props: { options: [...options] },
    })

    const radios = wrapper.findAll('input[type="radio"]')
    await radios[0]?.setValue(true)

    // Emits the selected option object
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]?.[0]).toEqual(options[0])

    await radios[1]?.setValue(true)
    expect(wrapper.emitted('update:modelValue')?.at(-1)?.[0]).toEqual(options[1])
  })
})
