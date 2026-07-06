import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ScalarTristateToggleGroup from './ScalarTristateToggleGroup.vue'
import type { ScalarTristateOption } from './types'

const options = [
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Green', value: 'green' },
] as const

describe('ScalarTristateToggleGroup', () => {
  it('renders a toggle for each option', () => {
    const wrapper = mount(ScalarTristateToggleGroup, {
      props: { options: [...options] },
    })

    const toggles = wrapper.findAll('button[role="checkbox"]')
    expect(toggles.length).toBe(options.length)
  })

  it('cycles an option through on -> off -> unset in the model', async () => {
    const onUpdate = vi.fn()
    const wrapper = mount(ScalarTristateToggleGroup, {
      props: {
        options: [...options],
        'onUpdate:modelValue': onUpdate,
      },
    })

    const toggles = wrapper.findAll('button[role="checkbox"]')

    await toggles[0]?.trigger('click')
    await nextTick()
    let lastCall = onUpdate.mock.calls.at(-1)?.[0] as ScalarTristateOption[]
    expect(lastCall.map((o) => ({ value: o.value, checked: o.checked }))).toEqual([{ value: 'red', checked: true }])

    await wrapper.setProps({ modelValue: lastCall })
    await toggles[0]?.trigger('click')
    await nextTick()
    lastCall = onUpdate.mock.calls.at(-1)?.[0] as ScalarTristateOption[]
    expect(lastCall.map((o) => ({ value: o.value, checked: o.checked }))).toEqual([{ value: 'red', checked: false }])

    await wrapper.setProps({ modelValue: lastCall })
    await toggles[0]?.trigger('click')
    await nextTick()
    lastCall = onUpdate.mock.calls.at(-1)?.[0] as ScalarTristateOption[]
    expect(lastCall).toEqual([])
  })
})
