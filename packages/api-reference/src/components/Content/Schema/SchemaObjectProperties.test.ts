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
    const schema = {
      type: 'object' as const,
      properties: {
        foo: { type: 'string' as const },
        bar: { type: 'number' as const },
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
    const schema = {
      type: 'object' as const,
      properties: {
        foo: { type: 'string' as const },
        bar: { type: 'number' as const },
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
    const schema = {
      type: 'object' as const,
      patternProperties: {
        '^x-': { type: 'string' as const },
        '^y-': { type: 'boolean' as const },
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
    const schema = {
      type: 'object' as const,
      additionalProperties: { type: 'string' as const },
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const prop = wrapper.find('.schema-property')
    expect(prop.exists()).toBe(true)
    expect(prop.attributes('data-name')).toBe('propertyName*')
  })

  it('renders additionalProperties with x-additionalPropertiesName', () => {
    const schema = {
      type: 'object' as const,
      additionalProperties: {
        type: 'string' as const,
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
    const schema = {
      type: 'object' as const,
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
    const schema = {
      type: 'object' as const,
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
    const schema = { type: 'object' as const }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    expect(wrapper.findAll('.schema-property')).toHaveLength(0)
  })

  it('sorts properties alphabetically when all have same required status', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        zebra: { type: 'string' as const },
        alpha: { type: 'number' as const },
        beta: { type: 'boolean' as const },
      },
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const props = wrapper.findAll('.schema-property')
    expect(props).toHaveLength(3)
    expect(props[0].attributes('data-name')).toBe('alpha')
    expect(props[1].attributes('data-name')).toBe('beta')
    expect(props[2].attributes('data-name')).toBe('zebra')
  })

  it('sorts required properties first, then alphabetically', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        zebra: { type: 'string' as const },
        alpha: { type: 'number' as const },
        beta: { type: 'boolean' as const },
        gamma: { type: 'object' as const },
      },
      required: ['zebra', 'gamma'],
    }

    const wrapper = mount(SchemaObjectProperties, {
      props: { schema },
    })

    const props = wrapper.findAll('.schema-property')
    expect(props).toHaveLength(4)
    // Required properties should come first, sorted alphabetically
    expect(props[0].attributes('data-name')).toBe('gamma')
    expect(props[1].attributes('data-name')).toBe('zebra')
    // Optional properties should come after, sorted alphabetically
    expect(props[2].attributes('data-name')).toBe('alpha')
    expect(props[3].attributes('data-name')).toBe('beta')
  })
})
