import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import DataTableCheckbox from './DataTableCheckbox.vue'

describe('DataTableCheckbox', () => {
  it('reflects the initial model value', () => {
    const wrapper = mount(DataTableCheckbox, { props: { modelValue: true } })

    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
  })

  it('emits the new checked value on change', async () => {
    const wrapper = mount(DataTableCheckbox, { props: { modelValue: false } })

    await wrapper.get('input').setValue(true)

    expect(wrapper.emitted('update:modelValue')).toEqual([[true]])
  })

  it('mirrors the model value once it settles', async () => {
    const wrapper = mount(DataTableCheckbox, { props: { modelValue: false } })

    await wrapper.setProps({ modelValue: true })

    expect(wrapper.get<HTMLInputElement>('input').element.checked).toBe(true)
  })

  it('does not revert the optimistic toggle while an async update is in flight', async () => {
    const wrapper = mount(DataTableCheckbox, { props: { modelValue: false } })
    const input = wrapper.get<HTMLInputElement>('input')

    // The native input flips itself immediately on click.
    input.element.checked = true
    await input.trigger('change')

    // The parent has not updated `modelValue` yet (it travels through the async event bus),
    // so the checkbox must keep the optimistic state rather than flicker back to the stale value.
    await nextTick()
    await flushPromises()
    expect(input.element.checked).toBe(true)

    // Once the update lands, the input still reflects the settled model value.
    await wrapper.setProps({ modelValue: true })
    expect(input.element.checked).toBe(true)
  })
})
