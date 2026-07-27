import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import RequestBodyStructured from './RequestBodyStructured.vue'
import RequestTable from './RequestTable.vue'

const defaultEnvironment: XScalarEnvironment = {
  color: 'blue',
  variables: [],
  description: 'Test Environment',
}

const schema: SchemaObject = {
  type: 'object',
  required: ['name'],
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
  },
}

const mountStructured = ({
  parsedValue,
  contentType = 'application/json',
}: {
  parsedValue: unknown
  contentType?: string
}) =>
  mount(RequestBodyStructured, {
    props: {
      parsedValue,
      bodySchema: schema,
      contentType,
      environment: defaultEnvironment,
    },
  })

describe('RequestBodyStructured', () => {
  it('builds rows from the parsed value and schema', async () => {
    const wrapper = mountStructured({ parsedValue: { name: 'Ada', age: 36 } })
    await nextTick()

    const table = wrapper.findComponent(RequestTable)
    expect(table.exists()).toBe(true)
    expect(table.props('data').map((row: { name: string; value: unknown }) => [row.name, row.value])).toEqual([
      ['name', 'Ada'],
      ['age', '36'],
    ])
  })

  it('emits the folded body as serialized JSON with restored types', async () => {
    const wrapper = mountStructured({ parsedValue: { name: 'Ada', age: 36 } })
    await nextTick()

    const table = wrapper.findComponent(RequestTable)
    table.vm.$emit('upsertRow', 1, { name: 'age', value: '37', isDisabled: false })
    await nextTick()

    const emitted = wrapper.emitted('update:value')
    expect(emitted).toHaveLength(1)
    expect(JSON.parse(emitted![0]![0] as string)).toEqual({ name: 'Ada', age: 37 })
  })

  it('emits YAML for yaml content types', async () => {
    const wrapper = mountStructured({
      parsedValue: { name: 'Ada' },
      contentType: 'application/yaml',
    })
    await nextTick()

    const table = wrapper.findComponent(RequestTable)
    table.vm.$emit('upsertRow', 0, { name: 'name', value: 'Grace', isDisabled: false })
    await nextTick()

    const emitted = wrapper.emitted('update:value')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]![0]).toBe('name: Grace\n')
  })

  it('skips the row rebuild for its own emitted value', async () => {
    const wrapper = mountStructured({ parsedValue: { name: 'Ada', age: 36 } })
    await nextTick()

    const table = wrapper.findComponent(RequestTable)
    // Clear the age field: the row must survive the store echo instead of vanishing
    table.vm.$emit('upsertRow', 1, { name: 'age', value: '', isDisabled: false })
    await nextTick()

    const emitted = wrapper.emitted('update:value')
    const serialized = emitted![0]![0] as string
    expect(JSON.parse(serialized)).toEqual({ name: 'Ada' })

    // Simulate the store echoing the new value back through the prop
    await wrapper.setProps({ parsedValue: JSON.parse(serialized) })
    await nextTick()

    const rows = wrapper
      .findComponent(RequestTable)
      .props('data')
      .map((row: { name: string }) => row.name)
    expect(rows).toContain('age')
  })

  it('rebuilds rows on external changes', async () => {
    const wrapper = mountStructured({ parsedValue: { name: 'Ada' } })
    await nextTick()

    await wrapper.setProps({ parsedValue: { name: 'Grace', age: 40 } })
    await nextTick()

    const table = wrapper.findComponent(RequestTable)
    expect(table.props('data').map((row: { name: string; value: unknown }) => [row.name, row.value])).toEqual([
      ['name', 'Grace'],
      ['age', '40'],
    ])
  })
})
