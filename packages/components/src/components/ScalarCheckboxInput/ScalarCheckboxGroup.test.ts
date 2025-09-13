import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarCheckboxGroup from './ScalarCheckboxGroup.vue'

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
] as const

describe('ScalarCheckboxGroup', () => {
  it('renders a checkbox for each option', () => {
    const wrapper = mount(ScalarCheckboxGroup, {
      props: { options: [...options] },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(options.length)
  })

  it('binds v-model to multiple selected options', async () => {
    const wrapper = mount(ScalarCheckboxGroup, {
      props: { options: [...options] },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[0]?.setValue(true)
    await checkboxes[2]?.setValue(true)

    // Expect model updates to contain the selected option objects
    const updates = wrapper.emitted('update:modelValue')
    expect(updates).toBeTruthy()
    const last = updates?.at(-1)?.[0] as unknown
    expect(Array.isArray(last)).toBe(true)
    const selected = last as Array<{ label: string; value: string }>
    expect(selected.map((o) => o.value)).toEqual(['red', 'green'])

    // Uncheck one and verify removal
    await checkboxes[0]?.setValue(false)
    const after = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as Array<{ value: string }>
    expect(after.map((o) => o.value)).toEqual(['green'])
  })
})
