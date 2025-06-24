import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SchemaComposition from './SchemaComposition.vue'

describe('SchemaComposition', () => {
  describe('schema name display', () => {
    it('displays schema title when both title and name are present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: {
            oneOf: [
              {
                name: 'OneModel',
                title: 'One',
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema name when title is not present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: {
            oneOf: [
              {
                name: 'One',
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('One')
    })

    it('displays schema title when name is not present', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: {
            anyOf: [
              {
                title: 'Any',
                type: 'object',
              },
            ],
          },
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
          value: {
            oneOf: [
              {
                type: 'object',
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('object')
    })

    // TODO: This would be nice to have, but we used to compare schemas and in some cases it returned the wrong name.
    // Let’s find another approach and enable this test again.
    it.todo('displays schema name from components when matching schema is found', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
              },
            },
          },
          value: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('User')
    })

    it('humanizes array types with item type', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'anyOf',
          value: {
            anyOf: [
              {
                type: 'array',
                items: {
                  type: 'string',
                },
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('Array of string')
    })
  })

  describe('composition display', () => {
    it('humanizes composition', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: {
            oneOf: [{ type: 'object' }],
          },
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
          value: {
            oneOf: [{ type: 'boolean' }, { type: 'object', properties: { foo: { type: 'string' } } }],
          },
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
        },
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
          value: {
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
          },
          level: 0,
        },
      })

      const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
      await listbox.vm.$emit('update:modelValue', { id: '2', label: 'Schema' })
      await wrapper.vm.$nextTick()

      const schemaComponent = wrapper.findComponent({ name: 'Schema' })
      expect(schemaComponent.exists()).toBe(true)
      expect(schemaComponent.props('value')).toEqual({ const: 'Baz' })
    })

    it('renders enum schema in composition panel', async () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: {
            oneOf: [
              {
                type: 'string',
                enum: ['option1', 'option2', 'option3'],
              },
              {
                type: 'number',
              },
            ],
          },
          level: 0,
        },
      })

      const schemaComponent = wrapper.findComponent({ name: 'Schema' })
      expect(schemaComponent.exists()).toBe(true)
      expect(schemaComponent.props('value')).toEqual({
        type: 'string',
        enum: ['option1', 'option2', 'option3'],
      })
    })

    it('handles nested compositions with titles', () => {
      const wrapper = mount(SchemaComposition, {
        props: {
          composition: 'oneOf',
          value: {
            oneOf: [
              {
                allOf: [
                  { title: 'Planet', type: 'object' },
                  { type: 'object', properties: { test: { type: 'string' } } },
                ],
              },
            ],
          },
          level: 0,
        },
      })

      const tab = wrapper.find('.composition-selector-label')
      expect(tab.text()).toBe('Planet')
    })
  })

  it('passes required array to Schema component for schema composition', () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: {
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
        },
        level: 0,
      },
    })

    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    expect(schemaComponent.props('value')).toEqual({
      type: 'object',
      properties: {
        foo: { const: 'Foo' },
      },
      required: ['foo'],
    })
  })

  it('merges allOf schemas within anyOf composition', () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: {
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
        },
        level: 0,
      },
    })

    // Check that the listbox options show the correct labels
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    const options = listbox.props('options')

    expect(options).toHaveLength(2)
    expect(options[0].label).toBe('string')
    expect(options[1].label).toBe('object')

    // Check that the first schema (string) is rendered correctly
    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    expect(schemaComponent.props('value')).toEqual({
      type: 'string',
    })
  })

  it('renders merged allOf schema when selected in anyOf composition', async () => {
    const wrapper = mount(SchemaComposition, {
      props: {
        composition: 'anyOf',
        value: {
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
        },
        level: 0,
      },
    })

    // Select the second option (merged allOf schema)
    const listbox = wrapper.findComponent({ name: 'ScalarListbox' })
    await listbox.vm.$emit('update:modelValue', { id: '1', label: 'object' })
    await wrapper.vm.$nextTick()

    // Check that the merged schema is rendered with both properties
    const schemaComponent = wrapper.findComponent({ name: 'Schema' })
    const schemaValue = schemaComponent.props('value')

    expect(schemaValue.type).toBe('object')
    expect(schemaValue.properties).toEqual({
      bar: {
        type: 'string',
      },
      baz: {
        type: 'string',
      },
    })
  })
})
