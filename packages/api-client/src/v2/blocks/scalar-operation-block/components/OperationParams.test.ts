import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OperationParams from './OperationParams.vue'

const ScalarTooltipStub = {
  name: 'ScalarTooltip',
  template: '<div><slot /></div>',
}

const ScalarButtonStub = {
  name: 'ScalarButton',
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot /></button>',
}

const environment = {
  uid: 'env-1' as any,
  name: 'Env',
  value: 'v',
  color: 'c',
}

describe('OperationParams', () => {
  it('renders with empty parameters and passes data to table', () => {
    const wrapper = mount(OperationParams, {
      props: {
        parameters: [],
        exampleKey: 'ex',
        title: 'Headers',
        environment,
        envVariables: [],
      },
      global: {
        stubs: {
          ScalarTooltip: ScalarTooltipStub,
          ScalarButton: ScalarButtonStub,
          RouterLink: true,
        },
      },
    })

    const table = wrapper.findComponent({ name: 'OperationTable' })
    expect(table.exists()).toBe(true)
  })

  it('re-emits add, update, and delete events from OperationTable', async () => {
    const wrapper = mount(OperationParams, {
      props: {
        parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } } as any],
        exampleKey: 'ex',
        title: 'Variables',
        environment,
        envVariables: [],
      },
      global: {
        stubs: {
          ScalarTooltip: ScalarTooltipStub,
          ScalarButton: ScalarButtonStub,
          RouterLink: true,
        },
      },
    })

    const table = wrapper.findComponent({ name: 'OperationTable' })
    // addRow -> add
    table.vm.$emit('addRow', { key: 'k', value: 'v' })
    expect(wrapper.emitted('add')?.[0]?.[0]).toEqual({ key: 'k', value: 'v' })

    // updateRow -> update
    table.vm.$emit('updateRow', 1, { key: 'x', value: 'y', isEnabled: true })
    expect(wrapper.emitted('update')?.[0]?.[0]).toEqual({
      index: 1,
      payload: { key: 'x', value: 'y', isEnabled: true },
    })

    // deleteRow -> delete
    table.vm.$emit('deleteRow', 2)
    expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual({ index: 2 })
  })
})
