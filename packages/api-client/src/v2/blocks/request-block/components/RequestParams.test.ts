import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { isParamDisabled } from '../helpers/is-param-disabled'
import RequestParams from './RequestParams.vue'

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

const eventBus = createWorkspaceEventBus()

describe('RequestParams', () => {
  it('renders with empty parameters and passes data to table', () => {
    const wrapper = mount(RequestParams, {
      props: {
        eventBus,
        rows: [],
        exampleKey: 'ex',
        title: 'Headers',
        environment,
      },
    })

    const table = wrapper.findComponent({ name: 'RequestTable' })
    expect(table.exists()).toBe(true)
  })

  it('re-emits upsert and delete events from RequestTable', async () => {
    const wrapper = mount(RequestParams, {
      props: {
        eventBus,
        rows: [{ name: 'id', value: 'value', isReadonly: true, schema: { type: 'string' } } as any],
        exampleKey: 'ex',
        title: 'Variables',
        environment,
      },
    })

    const table = wrapper.findComponent({ name: 'RequestTable' })

    // upsertRow -> upsert
    await table.vm.$emit('upsertRow', 1, { name: 'x', value: 'y', isDisabled: false })
    expect(wrapper.emitted('upsert')?.[0]?.[0]).toBe(1)
    expect(wrapper.emitted('upsert')?.[0]?.[1]).toEqual({
      name: 'x',
      value: 'y',
      isDisabled: false,
    })

    // deleteRow -> delete
    await table.vm.$emit('deleteRow', 2)
    expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual({ index: 2 })
  })

  it('ensures optional non-path parameters are disabled by default', () => {
    const parameters = [
      // Optional query parameter - should be disabled
      { name: 'limit', in: 'query', required: false, schema: { type: 'number' } },
      // Required query parameter - should NOT be disabled
      { name: 'apiKey', in: 'query', required: true, schema: { type: 'string' } },
      // Optional header parameter - should be disabled
      { name: 'X-Custom-Header', in: 'header', required: false, schema: { type: 'string' } },
      // Required header parameter - should NOT be disabled
      { name: 'Authorization', in: 'header', required: true, schema: { type: 'string' } },
      // Optional path parameter - should NOT be disabled (path params are always enabled)
      { name: 'id', in: 'path', required: false, schema: { type: 'string' } },
      // Required path parameter - should NOT be disabled
      { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
    ] as any

    // Transform parameters into rows format, just like RequestBlock does
    const rows = parameters.map((param: any) => ({
      name: param.name,
      value: '',
      schema: param.schema,
      isRequired: param.required,
      isDisabled: isParamDisabled(param, undefined),
    }))

    const wrapper = mount(RequestParams, {
      props: {
        eventBus,
        rows,
        exampleKey: 'ex',
        title: 'Parameters',
        environment,
      },
    })

    const table = wrapper.findComponent({ name: 'RequestTable' })
    const tableData = table.props('data')

    // Optional query parameter should be disabled
    expect(tableData[0].name).toBe('limit')
    expect(tableData[0].isDisabled).toBe(true)

    // Required query parameter should NOT be disabled
    expect(tableData[1].name).toBe('apiKey')
    expect(tableData[1].isDisabled).toBe(false)

    // Optional header parameter should be disabled
    expect(tableData[2].name).toBe('X-Custom-Header')
    expect(tableData[2].isDisabled).toBe(true)

    // Required header parameter should NOT be disabled
    expect(tableData[3].name).toBe('Authorization')
    expect(tableData[3].isDisabled).toBe(false)

    // Optional path parameter should NOT be disabled
    expect(tableData[4].name).toBe('id')
    expect(tableData[4].isDisabled).toBe(false)

    // Required path parameter should NOT be disabled
    expect(tableData[5].name).toBe('userId')
    expect(tableData[5].isDisabled).toBe(false)
  })
})
