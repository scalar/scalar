import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'

import DataTableInputSelect from './DataTableInputSelect.vue'

enableAutoUnmount(afterEach)

describe('DataTableInputSelect', () => {
  it('keeps comma-separated array values for parameters', () => {
    const wrapper = mount(DataTableInputSelect, {
      props: { modelValue: 'red,green', type: 'array', value: ['red', 'green', 'blue'] },
    })
    const select = wrapper.getComponent({ name: 'ScalarComboboxMultiselect' })
    expect(select.props('modelValue')).toStrictEqual([
      { id: 'red', label: 'red', value: 'red' },
      { id: 'green', label: 'green', value: 'green' },
    ])
    select.vm.$emit('update:modelValue', [{ id: 'blue', label: 'blue', value: 'blue' }])
    select.vm.$emit('update:modelValue', [])
    expect(wrapper.emitted('update:modelValue')).toStrictEqual([['blue'], ['']])
  })

  it.each(['', '[', 'null', '"red"', '{}'])('handles non-array JSON input %j', (modelValue) => {
    const wrapper = mount(DataTableInputSelect, {
      props: { modelValue, type: 'array', arrayEncoding: 'json', value: ['red', 'green'] },
    })
    const select = wrapper.getComponent({ name: 'ScalarComboboxMultiselect' })
    expect(select.props('modelValue')).toStrictEqual([])
    select.vm.$emit('update:modelValue', [{ id: 'green', label: 'green', value: 'green' }])
    expect(wrapper.emitted('update:modelValue')).toStrictEqual([['["green"]']])
  })
})
