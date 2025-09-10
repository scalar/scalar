import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaComposition from './SchemaComposition.vue'

describe('SchemaComposition', () => {
  describe('schema name display', () => {
    it('displays schema title when name is not present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: coerceValue(SchemaObjectSchema, {
            anyOf: [
              {
                title: 'Any',
                type: 'object',
              },
            ],
          }),
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('Any')
    })

    it('displays type when neither name nor title are present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: coerceValue(SchemaObjectSchema, {
            oneOf: [
              {
                type: 'object',
              },
            ],
          }),
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('object')
    })

    it('humanizes array types with item type', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: coerceValue(SchemaObjectSchema, {
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          }),
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('array string[]')
    })
  })

  describe('composition display', () => {
    it('humanizes composition', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: coerceValue(SchemaObjectSchema, {
            oneOf: [{ type: 'object' }],
          }),
          level: 0,
        },
      })

      const typeLabel = wrapper.find('span')
      expect(typeLabel.text()).toBe('One of')
    })

    it('renders primitive type in composition panel', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: coerceValue(SchemaObjectSchema, {
            oneOf: [{ type: 'boolean' }, { type: 'object', properties: { foo: { type: 'string' } } }],
          }),
          level: 0,
        },
      })

      expect(wrapper.text()).toContain('boolean')
    })

    it('renders nullable schema in composition panel', async () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: {
            anyOf: [
              {
                type: 'object',
                properties: { foo: { type: 'string' } },
              },
              { nullable: true },
            ],
          },
          level: 0,
        } as any,
      })

      const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
      await listbox.vm.$emit('update:modelValue', { id: '1', label: 'Schema' })
      await wrapper.vm.$nextTick()

      const panel = wrapper.find('.composition-panel')
      expect(panel.text()).toContain('nullable')
    })

    it('renders const schema in composition panel', async () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: coerceValue(SchemaObjectSchema, {
            anyOf: [
              {
                type: 'object',
                properties: { foo: { const: 'Foo' } },
                required: ['foo'],
              },
              {
                type: 'object',
                properties: { bar: { const: 'Bar' } },
              },
              { const: 'Baz' },
            ],
          }),
          level: 0,
        },
      })

      const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
      await listbox.vm.$emit('update:modelValue', { id: '2', label: 'Schema' })
      await wrapper.vm.$nextTick()

      const schemaComponent = wrapper.findComponent({ name: 'Schema' })
      expect(schemaComponent.exists()).toBe(true)
      expect(schemaComponent.props('schema')).toEqual({ '_': '', const: 'Baz' })
    })

    it('renders enum schema in composition panel', async () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: coerceValue(SchemaObjectSchema, {
            oneOf: [
              {
                type: 'string',
                enum: ['option1', 'option2', 'option3'],
              },
              {
                type: 'number',
              },
            ],
          }),
          level: 0,
        },
      })

      const schemaComponent = wrapper.findComponent({ name: 'Schema' })
      expect(schemaComponent.exists()).toBe(true)
      expect(schemaComponent.props('schema')).toEqual({
        type: 'string',
        enum: ['option1', 'option2', 'option3'],
      })
    })

    it('handles nested compositions with titles', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: coerceValue(SchemaObjectSchema, {
            oneOf: [
              { title: 'Planet', type: 'object' },
              { type: 'object', properties: { test: { type: 'string' } } },
            ],
          }),
          level: 0,
        },
      })

      const tab = wrapper.findAll('.composition-selector-label')[0]
      expect(tab.text()).toBe('Planet')
    })
  })

  it('passes required array to Schema component for schema composition', () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: coerceValue(SchemaObjectSchema, {
          anyOf: [
            {
              type: 'object',
              properties: {
                foo: { const: 'Foo' },
              },
              required: ['foo'],
            },
            {
              type: 'object',
              properties: {
                bar: { const: 'Bar' },
              },
            },
          ],
        }),
        level: 0,
      },
    })

    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    expect(schemaComponent.props('schema')).toEqual({
      type: 'object',
      properties: {
        foo: { _: '', const: 'Foo' },
      },
      required: ['foo'],
    })
  })

  it('does not merge allOf schemas within anyOf composition', () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: coerceValue(SchemaObjectSchema, {
          anyOf: [
            {
              type: 'string',
            },
            {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    baz: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          ],
        }),
        level: 0,
      },
    })

    // Check that the listbox options show the correct labels
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    const options = listbox.props('options')

    expect(options).toHaveLength(2)
    expect(options[0].label).toBe('string')
    expect(options[1].label).toBe('Schema')

    // Check that the first schema (string) is rendered correctly
    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    expect(schemaComponent.props('schema')).toEqual({
      type: 'string',
    })
  })

  it('does not merge allOf object schemas within anyOf composition', async () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: coerceValue(SchemaObjectSchema, {
          anyOf: [
            {
              type: 'string',
            },
            {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    bar: {
                      type: 'string',
                    },
                  },
                },
                {
                  type: 'object',
                  properties: {
                    baz: {
                      type: 'string',
                    },
                  },
                },
              ],
            },
          ],
        }),
        level: 0,
      },
    })

    // Select the second option (merged allOf schema)
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: '1', label: 'Schema' })
    await wrapper.vm.$nextTick()

    // Check that the merged schema is rendered with both properties
    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    const schemaValue = schemaComponent.props('schema')

    expect(typeof schemaValue).toBe('object')
    expect(schemaValue.allOf).toEqual([
      {
        type: 'object',
        properties: {
          bar: {
            type: 'string',
          },
        },
      },
      {
        type: 'object',
        properties: {
          baz: {
            type: 'string',
          },
        },
      },
    ])
  })
})
