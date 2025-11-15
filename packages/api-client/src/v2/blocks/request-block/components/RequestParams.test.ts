import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import RequestParams from './RequestParams.vue'

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

describe('RequestParams', () => {
  it('renders with empty parameters and passes data to table', () => {
    const wrapper = mount(RequestParams, {
      props: {
        parameters: [],
        exampleKey: 'ex',
        title: 'Headers',
        environment,
      },
    })

    const table = wrapper.findComponent({ name: 'RequestTable' })
    expect(table.exists()).toBe(true)
  })

  it('re-emits add, update, and delete events from RequestTable', async () => {
    const wrapper = mount(RequestParams, {
      props: {
        parameters: [{ name: 'id', in: 'path', schema: { type: 'string' } } as any],
        exampleKey: 'ex',
        title: 'Variables',
        environment,
      },
    })

    const table = wrapper.findComponent({ name: 'RequestTable' })

    // addRow -> add
    await table.vm.$emit('addRow', { key: 'k', value: 'v' })
    expect(wrapper.emitted('add')?.[0]?.[0]).toEqual({ key: 'k', value: 'v' })

    // updateRow -> update
    await table.vm.$emit('updateRow', 1, { key: 'x', value: 'y', isEnabled: true })
    expect(wrapper.emitted('update')?.[0]?.[0]).toEqual({
      index: 1,
      payload: { key: 'x', value: 'y', isEnabled: true },
    })

    // deleteRow -> delete
    await table.vm.$emit('deleteRow', 2)
    expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual({ index: 2 })
  })
})
