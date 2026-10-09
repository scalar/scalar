import { createWorkspaceEventBus } from '@scalar/workspace-store/events'
import { isParamDisabled } from '@scalar/workspace-store/request-example'
import type { ParameterObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import { createParameterRows } from '../helpers/create-parameter-rows'
import RequestParams from './RequestParams.vue'
import RequestTable from './RequestTable.vue'
import type { TableRow } from './RequestTableRow.vue'

const filter = {
  name: 'filters',
  in: 'query',
  style: 'deepObject',
  explode: true,
  schema: {
    type: 'object',
    required: ['required'],
    properties: {
      empty: { type: 'string', description: 'An optional filter' },
      required: { type: 'string' },
      populated: { type: 'string' },
      zero: { type: 'integer' },
    },
  },
  examples: { ex: { value: { populated: 'keep', zero: 0 }, 'x-disabled': true } },
} satisfies ParameterObject

const createRows = (): TableRow[] => [
  ...createParameterRows(filter, 'ex'),
  ...createParameterRows({ name: 'take', in: 'query', schema: { type: 'integer' } }, 'ex'),
]

const environment = {
  description: 'Test Environment',
  variables: [],
  color: 'c',
}

const eventBus = createWorkspaceEventBus()

describe('RequestParams', () => {
  it('offers only empty optional expanded fields while keeping ordinary and populated disabled parameters visible', () => {
    const wrapper = mount(RequestParams, {
      props: {
        rows: createRows(),
        selectExpandedParameters: true,
        eventBus,
        exampleKey: 'ex',
        title: 'Query Parameters',
        environment,
      },
    })
    expect(
      wrapper
        .getComponent(RequestTable)
        .props('data')
        .map((row) => [row.name, row.value]),
    ).toStrictEqual([
      ['filters[required]', ''],
      ['filters[populated]', 'keep'],
      ['filters[zero]', '0'],
      ['take', ''],
    ])
    expect(
      wrapper
        .getComponent({ name: 'ScalarCombobox' })
        .props('options')
        .map((option: { label: string }) => option.label),
    ).toStrictEqual(['filters[empty]'])
    wrapper.unmount()
  })

  it('adds an empty field without changing the request and focuses its value', async () => {
    const wrapper = mount(RequestParams, {
      attachTo: document.body,
      props: {
        rows: createRows(),
        selectExpandedParameters: true,
        eventBus,
        exampleKey: 'ex',
        title: 'Query Parameters',
        environment,
      },
    })
    const picker = wrapper.getComponent({ name: 'ScalarCombobox' })
    await picker.vm.$emit('update:modelValue', picker.props('options')[0])
    await flushPromises()
    expect(
      wrapper
        .getComponent(RequestTable)
        .props('data')
        .map((row) => row.name),
    ).toStrictEqual(['filters[empty]', 'filters[required]', 'filters[populated]', 'filters[zero]', 'take'])
    expect(wrapper.emitted('upsert')).toBeUndefined()
    expect(document.activeElement).toBe(wrapper.findAll('[contenteditable][aria-label=" Value"]')[0]?.element)
    await wrapper.get('button[aria-label="Delete filters[empty]"]').trigger('click')
    expect(wrapper.emitted('delete')).toStrictEqual([[{ index: 0 }]])
    expect(
      wrapper
        .getComponent({ name: 'ScalarCombobox' })
        .props('options')
        .map((option: { label: string }) => option.label),
    ).toStrictEqual(['filters[empty]'])
    wrapper.unmount()
  })

  it('maps edits and new custom rows to the full parameter context and retains a cleared field', async () => {
    const rows = createRows()
    const wrapper = mount(RequestParams, {
      props: {
        rows,
        selectExpandedParameters: true,
        eventBus,
        exampleKey: 'ex',
        title: 'Query Parameters',
        environment,
      },
    })
    const table = wrapper.getComponent(RequestTable)
    await table.vm.$emit('upsertRow', 1, { name: 'filters[populated]', value: '', isDisabled: false })
    await table.vm.$emit('upsertRow', 4, { name: 'custom', value: 'new', isDisabled: false })
    expect(wrapper.emitted('upsert')).toStrictEqual([
      [2, { name: 'filters[populated]', value: '', isDisabled: false }],
      [5, { name: 'custom', value: 'new', isDisabled: false }],
    ])
    await wrapper.setProps({
      rows: rows.map((row) => (row.name === 'filters[populated]' ? { ...row, value: '' } : row)),
    })
    expect(table.props('data').map((row) => row.name)).toStrictEqual([
      'filters[required]',
      'filters[populated]',
      'filters[zero]',
      'take',
    ])
    wrapper.unmount()
  })

  it('keeps the existing table for single-field objects and sections without selection enabled', () => {
    const rows = createParameterRows(
      { name: 'filter', in: 'query', schema: { type: 'object', properties: { status: { type: 'string' } } } },
      'ex',
    )
    const wrapper = mount(RequestParams, {
      props: {
        rows,
        selectExpandedParameters: true,
        eventBus,
        exampleKey: 'ex',
        title: 'Query Parameters',
        environment,
      },
    })
    expect(wrapper.getComponent(RequestTable).props('data')).toStrictEqual(rows)
    expect(wrapper.findComponent({ name: 'ScalarCombobox' }).exists()).toBe(false)
    wrapper.unmount()
    const ordinary = mount(RequestParams, {
      props: { rows: createRows(), eventBus, exampleKey: 'ex', title: 'Query Parameters', environment },
    })
    expect(ordinary.getComponent(RequestTable).props('data')).toStrictEqual(createRows())
    expect(ordinary.findComponent({ name: 'ScalarCombobox' }).exists()).toBe(false)
    ordinary.unmount()
  })

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
