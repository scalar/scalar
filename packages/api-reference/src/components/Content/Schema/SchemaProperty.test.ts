import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { DISCRIMINATOR_CONTEXT } from '@/hooks/useDiscriminator'

import Schema from './Schema.vue'
import SchemaProperty from './SchemaProperty.vue'

describe('SchemaProperty sub-schema', () => {
  it('renders sub-schema for type object with additional properties', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'object',
          additionalProperties: {
            nullable: true,
          },
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    await button.trigger('click')
    const schemas = wrapper.findAllComponents(Schema)

    expect(schemas).toHaveLength(1)
  })

  it('renders sub-schema for type object with properties', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'object',
          properties: {
            test: {
              type: 'string',
            },
          },
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    await button.trigger('click')
    const schemas = wrapper.findAllComponents(Schema)

    expect(schemas).toHaveLength(1)
  })

  it('renders no sub-schema for type object', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'object',
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('renders sub-schema for type array with object items', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
          },
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    await button.trigger('click')
    const schemas = wrapper.findAllComponents(Schema)

    expect(schemas).toHaveLength(1)
  })

  it('renders no sub-schema for type array with primitive items', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('renders no sub-schema for type string', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'string',
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('renders no sub-schema for type integer', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'integer',
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('renders no sub-schema for type number', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'number',
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('renders no sub-schema for type boolean', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          type: 'boolean',
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    const schemas = wrapper.findAllComponents(Schema)

    expect(button.exists()).toBe(false)
    expect(schemas).toHaveLength(0)
  })

  it('shows all enum values when there are 9 or fewer', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'],
        },
      },
    })

    const enumValues = wrapper.findAll('.property-enum-value')
    const toggleButton = wrapper.find('.enum-toggle-button')

    expect(enumValues).toHaveLength(9)
    expect(toggleButton.exists()).toBe(false)
  })

  it('shows only first 5 enum values and toggle button when there are more than 9', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        },
      },
    })

    const enumValues = wrapper.findAll('.property-enum-value')
    const toggleButton = wrapper.find('.enum-toggle-button')

    expect(enumValues).toHaveLength(5)
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.text()).toBe('Show all values')
  })

  it('shows all enum values when toggle button is clicked', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          enum: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'],
        },
      },
    })

    const toggleButton = wrapper.find('.enum-toggle-button')
    await toggleButton.trigger('click')

    const enumValues = wrapper.findAll('.property-enum-value')
    expect(enumValues).toHaveLength(10)
    expect(toggleButton.text()).toBe('Hide values')
  })

  it('handles enum values from items property', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          items: {
            enum: ['a', 'b', 'c'],
          },
        },
      },
    })

    const enumValues = wrapper.findAll('.property-enum-value')
    expect(enumValues).toHaveLength(3)
  })

  it('shows enum value when there is only one', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          enum: ['a'],
        },
      },
    })

    const enumValues = wrapper.findAll('.property-enum-value')
    expect(enumValues).toHaveLength(1)
  })

  it('show enum values ​​and descriptions', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
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
        },
      },
    })

    const enumList = wrapper.find('.property-enum .property-list')
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

  it('shows pattern properties for type object', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        pattern: true,
        value: {
          type: 'object',
          patternProperties: {
            '^foo-': {
              type: 'string',
            },
          },
        },
      },
    })

    const badge = wrapper.find('.property-pattern')
    expect(badge.exists()).toBe(true)
  })

  it('shows enums in compositions', () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
          anyOf: [{ type: 'string', enum: ['a', 'b', 'c'] }, { type: 'null' }],
        },
      },
    })

    const enumValues = wrapper.findAll('.property-enum-value')
    expect(enumValues).toHaveLength(3)
  })

  it('renders compositions for array items', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
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
        },
      },
    })

    expect(wrapper.find('button[aria-expanded="false"]').exists()).toBe(true)

    await wrapper.find('.schema-card-title').trigger('click')

    const foobar = wrapper.html().match(/foobar/g)
    expect(foobar).toHaveLength(1)
  })

  it('renders compositions for object of array items', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
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
        },
      },
    })

    // Check that the composition is not rendered
    expect(wrapper.html().match(/foobar/g)).toBeNull()
    expect(wrapper.find('button[aria-expanded="false"]').exists()).toBe(true)

    // Open the schema card
    await wrapper.find('.schema-card-title').trigger('click')

    // Find 'foobar' only once
    const foobar = wrapper.html().match(/foobar/g)
    expect(foobar).toHaveLength(1)
  })

  it('renders nested composition correctly', async () => {
    const wrapper = mount(SchemaProperty, {
      props: {
        value: {
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
        },
      },
    })

    // Check that the first level composition is rendered
    const firstLevelSelector = wrapper.find('.composition-selector')
    expect(firstLevelSelector.exists()).toBe(true)
    expect(firstLevelSelector.text()).toContain('One of')

    // Open the first level
    await firstLevelSelector.trigger('click')
    await wrapper.vm.$nextTick()

    // Check that the nested composition is rendered
    const nestedSelector = wrapper.find('.composition-panel .composition-selector')
    expect(nestedSelector.exists()).toBe(true)
    expect(nestedSelector.text()).toContain('One of')

    // Check that the titles are displayed correctly
    expect(wrapper.html()).toContain('foo (1)')
    expect(wrapper.html()).toContain('bar (1)')
  })

  it('renders array type object with properties correctly', async () => {
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
        },
      },
    })

    const button = wrapper.find('.schema-card-title')
    await button.trigger('click')
    await wrapper.vm.$nextTick()

    const html = wrapper.html()

    expect(html).toContain('galaxy')
    expect(html).toContain('Galaxy where the planet is located')
    expect(html).toContain('satellites')
    expect(html).toContain('List of satellites orbiting the planet')
    expect(html).toContain('habitable')
    expect(html).toContain('Whether the planet can support life')
  })
})

describe('SchemaProperty discriminator handling', () => {
  it('prevents discriminator context recursion for child properties', async () => {
    const mockDiscriminatorContext = {
      value: {
        mergedSchema: {
          type: 'object',
          properties: {
            satellites: {
              type: 'string',
              description: 'Satellites surrounding the planet',
            },
          },
          required: ['satellites'],
        },
        selectedType: 'Planet',
        discriminatorMapping: { Planet: 'PlanetSatellites' },
        discriminatorPropertyName: 'type',
      },
    }

    const childPropertySchema = {
      type: 'object',
      properties: {
        galaxy: {
          type: 'string',
          description: 'Galaxy of the planet',
        },
      },
      required: ['galaxy'],
    }

    const wrapper = mount(SchemaProperty, {
      props: {
        value: childPropertySchema,
        name: 'Satellites',
        level: 1,
      },
      global: {
        provide: {
          [DISCRIMINATOR_CONTEXT]: mockDiscriminatorContext,
        },
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
