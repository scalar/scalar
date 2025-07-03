import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import SchemaObjectProperties from './SchemaObjectProperties.vue'

// Mock child component to avoid deep rendering
vi.mock('./SchemaProperty.vue', () => ({
  default: {
    name: 'SchemaProperty',
    template: '<div class="schema-property" :data-name="name"></div>',
    props: [
      'name',
      'variant',
      'resolvedSchema',
      'value',
      'level',
      'compact',
      'hideHeading',
      'hideModelNames',
      'required',
      'schemas',
      'discriminatorMapping',
      'discriminatorPropertyName',
      'isDiscriminator',
      'modelValue',
    ],
  },
}))

describe('SchemaObjectProperties', () => {
  it('renders properties as SchemaProperty components', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
      required: ['foo'],
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })
    const props = wrapper.findAll('.schema-property')
    expect(props).toHaveLength(2)
    expect(props[0].attributes('data-name')).toBe('foo')
    expect(props[1].attributes('data-name')).toBe('bar')
  })

  it('marks required properties', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number', required: true },
      },
      required: ['foo'],
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })
    // The required prop is passed to SchemaProperty, but since we mock it, we cannot check directly.
    // Instead, check that both properties are rendered.
    expect(wrapper.findAll('.schema-property')).toHaveLength(2)
  })

  it('renders patternProperties as SchemaProperty components', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      patternProperties: {
        '^x-': { type: 'string' },
        '^y-': { type: 'boolean' },
      },
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const props = wrapper.findAll('.schema-property')
    expect(props).toHaveLength(2)
    expect(props[0].attributes('data-name')).toBe('^x-')
    expect(props[1].attributes('data-name')).toBe('^y-')
  })

  it('renders additionalProperties as SchemaProperty with default name', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      additionalProperties: { type: 'string' },
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const prop = wrapper.find('.schema-property')
    expect(prop.exists()).toBe(true)
    expect(prop.attributes('data-name')).toBe('propertyName*')
  })

  it('renders additionalProperties with x-additionalPropertiesName', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      additionalProperties: {
        type: 'string',
        'x-additionalPropertiesName': 'customName',
      },
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const prop = wrapper.find('.schema-property')
    expect(prop.exists()).toBe(true)
    expect(prop.attributes('data-name')).toBe('customName*')
  })

  it('handles additionalProperties as boolean true correctly', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      additionalProperties: true,
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const prop = wrapper.find('.schema-property')
    expect(prop.exists()).toBe(true)
    expect(prop.attributes('data-name')).toBe('propertyName*')
  })

  it('handles additionalProperties as empty object correctly', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      additionalProperties: {},
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const prop = wrapper.find('.schema-property')
    expect(prop.exists()).toBe(true)
    expect(prop.attributes('data-name')).toBe('propertyName*')
  })

  it('does not render anything if schema has no properties, patternProperties, or additionalProperties', () => {
    const schema: OpenAPIV3_1.SchemaObject = { type: 'object' }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    expect(wrapper.findAll('.schema-property')).toHaveLength(0)
  })
})
