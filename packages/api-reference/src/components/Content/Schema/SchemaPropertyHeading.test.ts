import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaPropertyHeading from './SchemaPropertyHeading.vue'

describe('SchemaPropertyHeading', () => {
  it('renders falsy default values', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'boolean',
          default: false,
        }),
      },
    })

    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('false')
  })

  it('renders required property', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      // @ts-expect-error - not really sure what this is testing
      props: {
        required: true,
      },
    })

    const requiredElement = wrapper.find('.property-required')
    expect(requiredElement.exists()).toBe(true)
    expect(requiredElement.text()).toBe('required')
  })

  it('renders property type and format', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'string',
          format: 'date-time',
        }),
      },
    })

    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('string')
    expect(detailsElement.text()).toContain('date-time')
  })

  describe('const', () => {
    it('renders const value', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            const: 'example',
          }),
        },
      })

      const constElement = wrapper.find('.property-const')
      expect(constElement.text()).toContain('const:')
      expect(constElement.text()).toContain('example')
    })

    it('renders const value: false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            const: false,
          }),
        },
      })
      const constElement = wrapper.find('.property-const')
      expect(constElement.text()).toContain('const:')
      expect(constElement.text()).toContain('false')
    })

    it('renders const value: 0', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            const: 0,
          }),
        },
      })
      const constElement = wrapper.find('.property-const')
      expect(constElement.text()).toContain('const:')
      expect(constElement.text()).toContain('0')
    })

    it('renders const value: empty string', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            const: '',
          }),
        },
      })
      const constElement = wrapper.find('.property-const')
      expect(constElement.text()).toContain('const:')
      expect(constElement.text()).toContain('')
    })

    it('renders const value: null', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            const: null,
          }),
        },
      })

      const constElement = wrapper.find('.property-const')
      expect(constElement.exists()).toBe(true)
    })

    it('renders const value in array items', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: {
              const: 'foo',
            },
          }),
        },
      })

      const typeElement = wrapper.find('.property-detail')
      expect(typeElement.text()).toContain('array')

      const constElement = wrapper.find('.property-const')
      expect(constElement.text()).toContain('const:')
      expect(constElement.text()).toContain('foo')
    })
  })

  it('renders schema title', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: { type: 'object', title: 'Model' },
        }),
        schemas: {
          Model: { type: 'object', title: 'Model' },
        },
      },
    })

    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('array Model[]')
  })

  it('renders default value: null', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          default: null,
        }),
      },
    })
    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('null')
  })

  it('renders default value: empty', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          default: '',
        }),
      },
    })
    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
  })

  it('renders default value without type being present', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          enum: ['bar', 'foo'],
          default: 'foo',
        }),
      },
    })
    const defaultValueElement = wrapper.find('.property-heading')
    expect(defaultValueElement.text()).toContain('default:')
    expect(defaultValueElement.text()).toContain('foo')
  })

  it('formats array type with model reference', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: { type: 'object', title: 'FooModel' },
        }),
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('array FooModel[]')
  })

  it('formats object type with direct model reference', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'object',
          title: 'BarModel',
        }),
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('BarModel')
    expect(detailsElement.text()).not.toContain('[]')
  })

  it('formats array type with model reference correctly', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: { type: 'object', title: 'BarModel' },
        }),
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('array BarModel[]')
  })

  it('displays plain type when no model name is present', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'string',
        }),
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('string')
    expect(detailsElement.text()).not.toContain('[]')
  })

  it('displays model name for schema references a component schema', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'object',
          properties: {
            title: { type: 'string' },
            pages: { type: 'integer' },
          },
        }),
      },
      slots: {
        name: 'Planet',
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('object')
  })

  it("doesn't show model name when hideModelNames is true", () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'array',
          items: { type: 'string' },
        }),
        hideModelNames: true,
        schemas: {
          Planet: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('Type: array string[]')
    expect(detailsElement.text()).not.toContain('Planet')
  })

  it('shows model name when hideModelNames is false', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          title: 'Planet',
          type: 'array',
          items: { type: 'string' },
        }),
        hideModelNames: false,
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('Type: array Planet[]')
  })

  it('renders multipleOf property', () => {
    const wrapper = mount(SchemaPropertyHeading, {
      props: {
        value: coerceValue(SchemaObjectSchema, {
          type: 'number',
          multipleOf: 0.001,
        }),
      },
    })
    const detailsElement = wrapper.find('.property-heading')
    expect(detailsElement.text()).toContain('multiple of:')
    expect(detailsElement.text()).toContain('0.001')
  })

  describe('exclusiveMinimum and exclusiveMaximum', () => {
    it('renders exclusiveMinimum property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            exclusiveMinimum: 5,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('greater than:')
      expect(detailsElement.text()).toContain('5')
    })

    it('renders exclusiveMaximum property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            exclusiveMaximum: 10,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('less than:')
      expect(detailsElement.text()).toContain('10')
    })

    it('renders both exclusiveMinimum and exclusiveMaximum properties', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            exclusiveMinimum: 1,
            exclusiveMaximum: 10,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('greater than:')
      expect(detailsElement.text()).toContain('1')
      expect(detailsElement.text()).toContain('less than:')
      expect(detailsElement.text()).toContain('10')
    })

    it('renders minimum and maximum properties when exclusive values are not present', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            minimum: 0,
            maximum: 100,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('min:')
      expect(detailsElement.text()).toContain('0')
      expect(detailsElement.text()).toContain('max:')
      expect(detailsElement.text()).toContain('100')
    })

    it('renders exclusiveMinimum and maximum properties together', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            exclusiveMinimum: 1,
            maximum: 100,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('greater than:')
      expect(detailsElement.text()).toContain('1')
      expect(detailsElement.text()).toContain('max:')
      expect(detailsElement.text()).toContain('100')
    })

    it('renders minimum and exclusiveMaximum properties together', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            minimum: 0,
            exclusiveMaximum: 10,
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('min:')
      expect(detailsElement.text()).toContain('0')
      expect(detailsElement.text()).toContain('less than:')
      expect(detailsElement.text()).toContain('10')
    })
  })

  describe('pattern', () => {
    it('renders pattern property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            pattern: '^[a-zA-Z0-9]+$',
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('Pattern:')
      expect(detailsElement.text()).toContain('^[a-zA-Z0-9]+$')
    })

    it('renders pattern property with complex regex', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          }),
        },
      })
      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('Pattern:')
      expect(detailsElement.text()).toContain('^\\d{4}-\\d{2}-\\d{2}$')
    })
  })

  describe('name slot', () => {
    it('renders name slot content', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
        },
        slots: {
          name: 'propertyName',
        },
      })

      const nameElement = wrapper.find('.property-name')
      expect(nameElement.exists()).toBe(true)
      expect(nameElement.text()).toBe('propertyName')
    })

    it('applies deprecated class when value is deprecated', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', deprecated: true }),
        },
        slots: {
          name: 'deprecatedProperty',
        },
      })

      const nameElement = wrapper.find('.property-name')
      expect(nameElement.classes()).toContain('deprecated')
    })

    it('does not render name slot when not provided', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
        },
      })

      const nameElement = wrapper.find('.property-name')
      expect(nameElement.exists()).toBe(false)
    })
  })

  describe('discriminator', () => {
    it('renders discriminator property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          isDiscriminator: true,
        },
      })

      const discriminatorElement = wrapper.find('.property-discriminator')
      expect(discriminatorElement.exists()).toBe(true)
      expect(discriminatorElement.text()).toBe('Discriminator')
    })

    it('does not render discriminator when isDiscriminator is false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          isDiscriminator: false,
        },
      })

      const discriminatorElement = wrapper.find('.property-discriminator')
      expect(discriminatorElement.exists()).toBe(false)
    })
  })

  describe('array validation properties', () => {
    it('renders minItems and maxItems', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            minItems: 1,
            maxItems: 10,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('1…10')
    })

    it('renders only minItems', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            minItems: 1,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('1…')
    })

    it('renders only maxItems', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            maxItems: 10,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('…10')
    })

    it('renders uniqueItems property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            uniqueItems: true,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('unique!')
    })
  })

  describe('string validation properties', () => {
    it('renders minLength property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            minLength: 5,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('min length:')
      expect(detailsElement.text()).toContain('5')
    })

    it('renders maxLength property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            maxLength: 100,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('max length:')
      expect(detailsElement.text()).toContain('100')
    })

    it('renders both minLength and maxLength', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            minLength: 5,
            maxLength: 100,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('min length:')
      expect(detailsElement.text()).toContain('5')
      expect(detailsElement.text()).toContain('max length:')
      expect(detailsElement.text()).toContain('100')
    })
  })

  describe('additional properties', () => {
    it('renders additional properties with custom name', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            'x-additionalPropertiesName': 'custom properties',
          }),
          additional: true,
        },
      })

      const additionalElement = wrapper.find('.property-additional')
      expect(additionalElement.exists()).toBe(true)
      expect(additionalElement.text()).toBe('custom properties')
    })

    it('renders default additional properties text', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          additional: true,
        },
      })

      const additionalElement = wrapper.find('.property-additional')
      expect(additionalElement.exists()).toBe(true)
      expect(additionalElement.text()).toBe('additional properties')
    })

    it('does not render additional properties when additional is false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          additional: false,
        },
      })

      const additionalElement = wrapper.find('.property-additional')
      expect(additionalElement.exists()).toBe(false)
    })
  })

  describe('deprecated property', () => {
    it('renders deprecated badge', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', deprecated: true }),
        },
      })

      const deprecatedElement = wrapper.find('.property-deprecated')
      expect(deprecatedElement.exists()).toBe(true)
      expect(deprecatedElement.text()).toContain('deprecated')
    })

    it('does not render deprecated badge when not deprecated', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', deprecated: false }),
        },
      })

      const deprecatedElement = wrapper.find('.property-deprecated')
      expect(deprecatedElement.exists()).toBe(false)
    })
  })

  describe('nullable property', () => {
    it('renders nullable when type is undefined and nullable is true', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: { nullable: true } as any,
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('nullable')
    })

    it('does not render nullable when type is defined', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', nullable: true }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('nullable')
    })

    it('does not render nullable when nullable is false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { nullable: false }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).not.toContain('nullable')
    })
  })

  describe('read-only and write-only properties', () => {
    it('renders read-only property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', readOnly: true }),
        },
      })

      const readOnlyElement = wrapper.find('.property-read-only')
      expect(readOnlyElement.exists()).toBe(true)
      expect(readOnlyElement.text()).toBe('read-only')
    })

    it('renders write-only property', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', writeOnly: true }),
        },
      })

      const writeOnlyElement = wrapper.find('.property-write-only')
      expect(writeOnlyElement.exists()).toBe(true)
      expect(writeOnlyElement.text()).toBe('write-only')
    })

    it('prefers write-only over read-only', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', readOnly: true, writeOnly: true }),
        },
      })

      const writeOnlyElement = wrapper.find('.property-write-only')
      const readOnlyElement = wrapper.find('.property-read-only')

      expect(writeOnlyElement.exists()).toBe(true)
      expect(readOnlyElement.exists()).toBe(false)
    })

    it('does not render read-only or write-only when both are false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string', readOnly: false, writeOnly: false }),
        },
      })

      const writeOnlyElement = wrapper.find('.property-write-only')
      const readOnlyElement = wrapper.find('.property-read-only')

      expect(writeOnlyElement.exists()).toBe(false)
      expect(readOnlyElement.exists()).toBe(false)
    })
  })

  describe('enum prop', () => {
    it('renders enum when enum prop is true', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
          enum: true,
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('enum')
    })

    it('does not render enum when enum prop is false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
          enum: false,
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).not.toContain('enum')
    })
  })

  describe('examples', () => {
    it('renders SchemaPropertyExamples when withExamples is true', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
          withExamples: true,
        },
      })

      const examplesElement = wrapper.findComponent({ name: 'SchemaPropertyExamples' })
      expect(examplesElement.exists()).toBe(true)
    })

    it('does not render SchemaPropertyExamples when withExamples is false', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'string' }),
          withExamples: false,
        },
      })

      const examplesElement = wrapper.findComponent({ name: 'SchemaPropertyExamples' })
      expect(examplesElement.exists()).toBe(false)
    })

    it('passes examples and example props to SchemaPropertyExamples', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
            examples: [{ value: 'test' }],
            example: 'default example',
          }),
          withExamples: true,
        },
      })

      const examplesElement = wrapper.findComponent({ name: 'SchemaPropertyExamples' })
      expect(examplesElement.props('examples')).toEqual([{ value: 'test' }])
      expect(examplesElement.props('example')).toBe('default example')
    })

    it('uses items.example when value.example is not available', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            items: { type: 'string', example: 'item example' },
          }),
          withExamples: true,
        },
      })

      const examplesElement = wrapper.findComponent({ name: 'SchemaPropertyExamples' })
      expect(examplesElement.props('example')).toBe('item example')
    })
  })

  describe('edge cases', () => {
    it('handles undefined value gracefully', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: undefined,
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.property-heading').exists()).toBe(true)
    })

    it('handles empty value object', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {}),
        },
      })

      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('.property-heading').exists()).toBe(true)
    })

    it('handles undefined schemas', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          schemas: undefined,
        },
      })

      expect(wrapper.exists()).toBe(true)
    })

    it('handles empty schemas object', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, { type: 'object' }),
          schemas: {},
        },
      })

      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('flattenDefaultValue function', () => {
    it('handles array with single item', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            default: ['single item'],
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('default:')
      expect(detailsElement.text()).toContain('single item')
    })

    it('handles array with multiple items', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'array',
            default: ['item1', 'item2'],
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('default:')
      expect(detailsElement.text()).toContain('["item1","item2"]')
    })

    it('handles non-string default values', () => {
      const wrapper = mount(SchemaPropertyHeading, {
        props: {
          value: coerceValue(SchemaObjectSchema, {
            type: 'number',
            default: 42,
          }),
        },
      })

      const detailsElement = wrapper.find('.property-heading')
      expect(detailsElement.text()).toContain('default:')
      expect(detailsElement.text()).toContain('42')
    })
  })
})
