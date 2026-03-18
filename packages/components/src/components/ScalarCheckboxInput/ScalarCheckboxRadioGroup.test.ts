import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    const onUpdate = vi.fn()
    const wrapper = mount(ScalarCheckboxRadioGroup, {
      props: {
        options: [...options],
        'onUpdate:modelValue': onUpdate,
      },
    })

    const radios = wrapper.findAll('input[type="radio"]')

    // Select first radio
    const radio0 = radios[0]?.element as HTMLInputElement
    radio0.checked = true
    await radios[0]?.trigger('change')
    await nextTick()

    // Emits the selected option object
    expect(onUpdate).toHaveBeenCalled()
    expect(onUpdate.mock.calls[0]?.[0]).toEqual(options[0])

    // Select second radio
    const radio1 = radios[1]?.element as HTMLInputElement
    radio1.checked = true
    await radios[1]?.trigger('change')
    await nextTick()

    expect(onUpdate.mock.calls.at(-1)?.[0]).toEqual(options[1])
  })
})
