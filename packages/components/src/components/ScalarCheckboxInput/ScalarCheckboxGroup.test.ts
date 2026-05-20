import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    const onUpdate = vi.fn()
    const wrapper = mount(ScalarCheckboxGroup, {
      props: {
        options: [...options],
        'onUpdate:modelValue': onUpdate,
      },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    // Check first checkbox
    const checkbox0 = checkboxes[0]?.element as HTMLInputElement
    checkbox0.checked = true
    await checkboxes[0]?.trigger('change')
    await nextTick()

    // Check third checkbox
    const checkbox2 = checkboxes[2]?.element as HTMLInputElement
    checkbox2.checked = true
    await checkboxes[2]?.trigger('change')
    await nextTick()

    // Expect model updates to contain the selected option objects
    expect(onUpdate).toHaveBeenCalled()
    const lastCall = onUpdate.mock.calls.at(-1)?.[0] as Array<{ label: string; value: string }>
    expect(Array.isArray(lastCall)).toBe(true)
    expect(lastCall.map((o) => o.value)).toEqual(['red', 'green'])

    // Uncheck one and verify removal
    checkbox0.checked = false
    await checkboxes[0]?.trigger('change')
    await nextTick()

    const afterCall = onUpdate.mock.calls.at(-1)?.[0] as Array<{ value: string }>
    expect(afterCall.map((o) => o.value)).toEqual(['green'])
  })
})
