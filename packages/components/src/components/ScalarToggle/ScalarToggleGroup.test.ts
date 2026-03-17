import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

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
    const onUpdate = vi.fn()
    const wrapper = mount(ScalarToggleGroup, {
      props: {
        options: [...options],
        'onUpdate:modelValue': onUpdate,
      },
    })

    const toggles = wrapper.findAll('button[role="switch"]')

    await toggles[0]?.trigger('click')
    await nextTick()
    await toggles[2]?.trigger('click')
    await nextTick()

    // Expect model updates to contain the selected option objects
    expect(onUpdate).toHaveBeenCalled()
    const lastCall = onUpdate.mock.calls.at(-1)?.[0] as Array<{ label: string; value: string }>
    expect(lastCall.map((o) => o.value)).toEqual(['red', 'green'])

    // Unselect one and verify removal
    await toggles[0]?.trigger('click')
    await nextTick()
    const afterCall = onUpdate.mock.calls.at(-1)?.[0] as Array<{ value: string }>
    expect(afterCall.map((o) => o.value)).toEqual(['green'])
  })
})
