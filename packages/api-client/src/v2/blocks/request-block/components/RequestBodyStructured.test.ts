import type { XScalarEnvironment } from '@scalar/workspace-store/schemas/extensions/document/x-scalar-environments'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'

import { CodeInputLite } from '@/v2/components/code-input'

import RequestBodyStructured from './RequestBodyStructured.vue'
import RequestTable from './RequestTable.vue'
import RequestTableRow from './RequestTableRow.vue'

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
  it.each(['application/json', 'application/yaml'])(
    'keeps body key focus and saves on blur or send for %s',
    async (contentType) => {
      const wrapper = mount(RequestBodyStructured, {
        attachTo: document.body,
        props: { parsedValue: { existing: 'value' }, contentType, environment: defaultEnvironment },
      })
      try {
        for (const index of [0, 1]) {
          const row = wrapper.findAllComponents(RequestTableRow)[index]!
          const input = row.findAllComponents(CodeInputLite)[0]!
          const editor = input.get('[contenteditable="true"]').element as HTMLElement
          editor.focus()
          const eventCount = wrapper.emitted('update:value')?.length ?? 0
          let name = row.props('data').name
          for (const character of 'note') {
            name += character
            input.vm.$emit('update:modelValue', name)
            await nextTick()
            expect(document.activeElement).toBe(editor)
            expect(wrapper.emitted('update:value')?.length ?? 0).toBe(eventCount)
          }
          if (index === 0) {
            input.vm.$emit('blur', name, new FocusEvent('blur'))
          } else {
            editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true }))
          }
          await nextTick()
          expect(wrapper.findComponent(RequestTable).props('data')[index]?.name).toBe(name)
          expect(wrapper.emitted('update:value')?.length).toBe(eventCount + 1)
        }
      } finally {
        wrapper.unmount()
      }
    },
  )
})
