import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ScalarToggleGroup from './ScalarToggleGroup.vue'

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
] as const

describe('ScalarToggleGroup', () => {
  it('renders a toggle for each option', () => {
    const wrapper = mount(ScalarToggleGroup, {
      props: { options: [...options] },
    })

    const toggles = wrapper.findAll('button[role="switch"]')
    expect(toggles.length).toBe(options.length)
  })

  it('binds v-model to multiple selected options', async () => {
    const wrapper = mount(ScalarToggleGroup, {
      props: { options: [...options] },
    })

    const toggles = wrapper.findAll('button[role="switch"]')

    await toggles[0]?.trigger('click')
    await toggles[2]?.trigger('click')

    // Expect model updates to contain the selected option objects
    const updates = wrapper.emitted('update:modelValue')
    expect(updates).toBeTruthy()
    const last = updates?.at(-1)?.[0] as Array<{ label: string; value: string }>
    expect(last.map((o) => o.value)).toEqual(['red', 'green'])

    // Unselect one and verify removal
    await toggles[0]?.trigger('click')
    const after = wrapper.emitted('update:modelValue')?.at(-1)?.[0] as Array<{ value: string }>
    expect(after.map((o) => o.value)).toEqual(['green'])
  })
})
