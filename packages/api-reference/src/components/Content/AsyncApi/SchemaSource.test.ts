import { ScalarCopy } from '@scalar/components/copy'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaSource from './SchemaSource.vue'

describe('SchemaSource', () => {
  it('preserves text and whitespace on screen and in the clipboard', () => {
    const value = 'syntax = "proto3";\n\nmessage User {\n  string id = 1;\n}\n'
    const wrapper = mount(SchemaSource, { props: { format: 'application/vnd.google.protobuf;version=3', value } })
    expect(wrapper.get('pre').element.textContent).toBe(value)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(value)
    expect(wrapper.text()).toContain('application/vnd.google.protobuf;version=3')
  })

  it.each([
    { value: ['null', 'string'] },
    { value: { type: 'record', name: 'User', fields: [{ name: 'id', type: 'string' }] } },
  ])('formats structured source without interpreting it as JSON Schema: %j', ({ value }) => {
    const wrapper = mount(SchemaSource, {
      props: { format: 'application/vnd.apache.avro+json;version=1.9.0', value },
    })
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(JSON.stringify(value, null, 2))
  })

  it('escapes markup in source text', () => {
    const value = '<script>alert(1)</script>'
    const wrapper = mount(SchemaSource, { props: { format: 'application/x-custom', value } })
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe(value)
  })

  it('updates source when its value changes', async () => {
    const wrapper = mount(SchemaSource, { props: { format: 'application/x-custom', value: 'first' } })
    await wrapper.setProps({ value: 'second' })
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('second')
  })

  it('serializes recursive structured source without crashing', () => {
    const value: Record<string, unknown> = { name: 'User' }
    value.self = value
    const wrapper = mount(SchemaSource, { props: { format: 'application/x-custom', value } })
    expect(wrapper.getComponent(ScalarCopy).props('content')).toBe('{\n  "name": "User",\n  "self": "[Circular]"\n}')
  })
})
