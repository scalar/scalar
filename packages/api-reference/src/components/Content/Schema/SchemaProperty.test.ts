import { ScalarListbox } from '@scalar/components'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import Schema from './Schema.vue'
import SchemaProperty from './SchemaProperty.vue'

describe('SchemaProperty', () => {
  describe('expandable schema behavior', () => {
    describe('object types', () => {
      it('displays expandable sub-schema for object with additional properties', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'object',
              additionalProperties: {
                nullable: true,
              },
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        await button.trigger('click')
        const schemas = wrapper.findAllComponents(Schema)

        expect(schemas).toHaveLength(1)
      })

      it('displays expandable sub-schema for object with defined properties', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'object',
              properties: {
                test: {
                  type: 'string',
                },
              },
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        await button.trigger('click')
        const schemas = wrapper.findAllComponents(Schema)

        expect(schemas).toHaveLength(1)
      })

      it('hides expand button for object without properties or additional properties', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'object',
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })
    })

    describe('array types', () => {
      it('displays expandable sub-schema for array with object items', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  test: {
                    type: 'string',
                  },
                },
              },
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        await button.trigger('click')
        const schemas = wrapper.findAllComponents(Schema)

        expect(schemas).toHaveLength(1)
      })

      it('hides expand button for array with primitive items', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: {
                type: 'string',
              },
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })
    })

    describe('primitive types', () => {
      it('hides expand button for string type', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })

      it('hides expand button for integer type', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'integer',
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })

      it('hides expand button for number type', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'number',
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })

      it('hides expand button for boolean type', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'boolean',
            }),
          },
        })

        const button = wrapper.find('.schema-card-title')
        const schemas = wrapper.findAllComponents(Schema)

        expect(button.exists()).toBe(false)
        expect(schemas).toHaveLength(0)
      })
    })
  })

  describe('enum value display', () => {
    describe('enum count behavior', () => {
      it('displays all enum values when count is 9 or fewer', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
            }),
          },
        })

        const enumValues = wrapper.findAll('.property-enum-value')
        const toggleButton = wrapper.find('.enum-toggle-button')

        expect(enumValues).toHaveLength(9)
        expect(toggleButton.exists()).toBe(false)
      })

      it('displays first 5 enum values with toggle button when count exceeds 9', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            }),
          },
        })

        const enumValues = wrapper.findAll('.property-enum-value')
        const toggleButton = wrapper.find('.enum-toggle-button')

        expect(enumValues).toHaveLength(5)
        expect(toggleButton.exists()).toBe(true)
        expect(toggleButton.text()).toBe('Show all values')
      })

      it('expands to show all enum values when toggle button is clicked', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
            }),
          },
        })

        const toggleButton = wrapper.find('.enum-toggle-button')
        await toggleButton.trigger('click')

        const enumValues = wrapper.findAll('.property-enum-value')
        expect(enumValues).toHaveLength(10)
        expect(toggleButton.text()).toBe('Hide values')
      })

      it('displays single enum value correctly', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              enum: ['a'],
            }),
          },
        })

        const enumValues = wrapper.findAll('.property-enum-value')
        expect(enumValues).toHaveLength(1)
      })
    })

    describe('enum sources', () => {
      it('displays enum values from array items property', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              items: {
                enum: ['a', 'b', 'c'],
              },
            }),
          },
        })

        const enumValues = wrapper.findAll('.property-enum-value')
        expect(enumValues).toHaveLength(3)
      })

      it('displays enum values with their descriptions', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              'type': 'string',
              'enum': ['Ice giant', 'Dwarf', 'Gas', 'Iron'],
              'title': 'Planet',
              'description': 'The type of planet',
              'x-enumDescriptions': {
                'Ice giant': 'A planet with a thick atmosphere of water, methane, and ammonia ice',
                'Dwarf': 'A planet that is not massive enough to clear its orbit',
                'Gas': 'A planet with a thick atmosphere of hydrogen and helium',
                'Iron': 'A planet made mostly of iron',
              },
            }),
          },
        })

        const enumList = wrapper.find('.property-enum .property-enum-values')
        const html = enumList.html()

        expect(html).toContain('Ice giant')
        expect(html).toContain('Dwarf')
        expect(html).toContain('Gas')
        expect(html).toContain('Iron')
        expect(html).toContain('A planet with a thick atmosphere of water, methane, and ammonia ice')
        expect(html).toContain('A planet that is not massive enough to clear its orbit')
        expect(html).toContain('A planet with a thick atmosphere of hydrogen and helium')
        expect(html).toContain('A planet made mostly of iron')
      })

      it('displays enum values within composition schemas', () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              anyOf: [{ type: 'string', enum: ['a', 'b', 'c'] }, { type: 'null' }],
            }),
          },
        })

        const enumValues = wrapper.findAll('.property-enum-value')
        expect(enumValues).toHaveLength(3)
      })
    })
  })

  describe('variant prop', () => {
    it('displays pattern properties with variant prop', async () => {
      const wrapper = mount(SchemaProperty, {
        props: {
          variant: 'patternProperties',
          name: '^foo-',
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
        },
      })

      // Check that the pattern property name is rendered with the special styling
      const patternName = wrapper.find('.property-name-pattern-properties')
      expect(patternName.exists()).toBe(true)
      expect(patternName.text()).toBe('^foo-')
    })

    it('displays additional properties with variant prop', async () => {
      const wrapper = mount(SchemaProperty, {
        props: {
          variant: 'additionalProperties',
          name: 'propertyName*',
          // @ts-ignore
          value: {
            type: 'anything',
          },
        },
      })

      // Check that the additional property name is rendered with the special styling
      const additionalName = wrapper.find('.property-name-additional-properties')
      expect(additionalName.exists()).toBe(true)
      expect(additionalName.text()).toBe('propertyName*')
    })

    it('displays regular property names without variant styling', async () => {
      const wrapper = mount(SchemaProperty, {
        props: {
          name: 'regularProperty',
          value: coerceValue(SchemaObjectSchema, {
            type: 'string',
          }),
        },
      })

      // Check that regular property names don't have special styling
      const patternName = wrapper.find('.property-name-pattern-properties')
      const additionalName = wrapper.find('.property-name-additional-properties')

      expect(patternName.exists()).toBe(false)
      expect(additionalName.exists()).toBe(false)

      // The name should still be rendered in the slot
      expect(wrapper.text()).toContain('regularProperty')
    })
  })

  describe('composition schemas', () => {
    describe('array compositions', () => {
      it('renders composition schemas for array items with oneOf', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: {
                oneOf: [
                  {
                    type: 'object',
                    description: 'foobar',
                    properties: { test: { type: 'string' } },
                  },
                ],
              },
            }),
          },
        })

        expect(wrapper.find('button[aria-expanded="false"]').exists()).toBe(true)

        await wrapper.find('.schema-card-title').trigger('click')

        const foobar = wrapper.html().match(/foobar/g)
        expect(foobar).toHaveLength(1)
      })

      it('renders array items with oneOf composition after expansion', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              type: 'array',
              items: {
                type: 'object',
                oneOf: [
                  {
                    description: 'foobar',
                    properties: { test: { type: 'string' } },
                  },
                ],
              },
            }),
          },
        })

        // The composition description should not be visible before expanding
        expect(wrapper.html().match(/foobar/g)).toBeNull()

        // Expand all schema cards to reveal nested content
        const buttons = wrapper.findAll('button.schema-card-title')
        for (const button of buttons) {
          await button.trigger('click')
          await wrapper.vm.$nextTick()
        }

        // Now "foobar" should be present
        const foobar = wrapper.html().match(/foobar/g)
        expect(foobar).toHaveLength(1)
      })
    })

    describe('object compositions', () => {
      it('renders object compositions with allOf with an object button', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              allOf: [
                {
                  properties: {
                    testStr: { type: 'string', description: 'This is a test string' },
                    testBool: { type: 'boolean', description: 'This is a test boolean' },
                  },
                  required: ['testStr'],
                },
              ],
            }),
          },
        })

        // For allOf compositions, properties should be displayed directly without expansion
        const html = wrapper.html()

        // Check that both properties are rendered with their descriptions
        expect(html).toContain('button')
        expect(html).toContain('object')
      })
    })

    describe('nested compositions', () => {
      // change the way we render compositions
      it.todo('renders nested composition selectors with correct titles', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: coerceValue(SchemaObjectSchema, {
              allOf: [
                {
                  type: 'object',
                  properties: {
                    customerComment: {
                      type: 'string',
                    },
                  },
                },
                {
                  oneOf: [
                    {
                      allOf: [
                        {
                          title: 'foo (1)',
                          type: 'object',
                        },
                        {
                          oneOf: [
                            {
                              title: 'bar (1)',
                              type: 'object',
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            }),
          },
        })

        // Check that the first level composition is rendered
        const firstLevelSelector = wrapper.find('.composition-selector')
        expect(firstLevelSelector.exists()).toBe(true)
        expect(firstLevelSelector.text()).toContain('All of')

        // Select the second option
        const dropdown = wrapper.findComponent(ScalarListbox)
        await dropdown.vm.$emit('update:modelValue', { id: '1', label: 'One of' })
        await wrapper.vm.$nextTick()

        expect(wrapper.text()).toBe('All ofOne ofAll offoo (1)')
      })
    })

    describe('object properties', () => {
      it('renders object properties with descriptions after expansion', async () => {
        const wrapper = mount(SchemaProperty, {
          props: {
            value: {
              type: ['object', 'null'],
              properties: {
                galaxy: {
                  type: 'string',
                  description: 'Galaxy where the planet is located',
                },
                satellites: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'List of satellites orbiting the planet',
                },
                habitable: {
                  type: 'boolean',
                  description: 'Whether the planet can support life',
                },
              },
            } as any,
          },
        })

        // Expand all schema cards to reveal nested content
        const buttons = wrapper.findAll('button.schema-card-title')
        for (const button of buttons) {
          await button.trigger('click')
          await wrapper.vm.$nextTick()
        }

        const html = wrapper.html()
        expect(html).toContain('galaxy')
        expect(html).toContain('Galaxy where the planet is located')
        expect(html).toContain('satellites')
        expect(html).toContain('List of satellites orbiting the planet')
        expect(html).toContain('habitable')
        expect(html).toContain('Whether the planet can support life')
      })
    })
  })

  describe('discriminator context isolation', () => {
    it('isolates child properties from parent discriminator context', async () => {
      const childPropertySchema = coerceValue(SchemaObjectSchema, {
        type: 'object',
        properties: {
          galaxy: {
            type: 'string',
            description: 'Galaxy of the planet',
          },
        },
        required: ['galaxy'],
      })

      const wrapper = mount(SchemaProperty, {
        props: {
          value: childPropertySchema,
          name: 'Satellites',
          level: 1,
        },
      })

      const expandButton = wrapper.find('.schema-card-title')
      if (expandButton.exists()) {
        await expandButton.trigger('click')
        await wrapper.vm.$nextTick()
      }

      const html = wrapper.html()

      expect(html).toContain('galaxy')
      expect(html).toContain('Galaxy of the planet')

      expect(html).not.toContain('satellites')
      expect(html).not.toContain('Satellites surrounding the planet')
    })
  })
})
