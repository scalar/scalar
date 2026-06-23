import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'

describe('propertyNames key constraints', () => {
  it('surfaces the propertyNames format for a map of additional properties', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { type: 'object', title: 'Resource', properties: { foo: { type: 'number' } } },
      },
      propertyNames: { title: 'Resource ID', type: 'string', format: 'uuid' },
    }) as SchemaObject

    const wrapper = mount(Schema, {
      props: { schema, options: {}, eventBus: null, name: 'resource_timelines' },
    })

    const text = wrapper.text()
    // The key title is used as the property name
    expect(text).toContain('Resource ID')
    // The key type and format are now shown instead of being dropped
    expect(text).toContain('uuid')
  })

  it('does not render key details when there is no propertyNames schema', () => {
    const schema = coerceValue(SchemaObjectSchema, {
      type: 'object',
      additionalProperties: { type: 'string' },
    }) as SchemaObject

    const wrapper = mount(Schema, {
      props: { schema, options: {}, eventBus: null, name: 'map' },
    })

    expect(wrapper.text()).not.toContain('keys:')
  })
})
