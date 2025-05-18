import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

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

  it('shows enums in discriminators', () => {
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

  it('renders discriminators for array items', () => {
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

    // Find 'foobar' only once
    const foobar = wrapper.html().match(/foobar/g)
    expect(foobar).toHaveLength(1)
  })

  it('renders discriminators for object of array items', async () => {
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

    // Check that the discriminator is not rendered
    expect(wrapper.html().match(/foobar/g)).toBeNull()
    expect(wrapper.find('button[aria-expanded="false"]').exists()).toBe(true)

    // Open the schema card
    await wrapper.find('.schema-card-title').trigger('click')

    // Find 'foobar' only once
    const foobar = wrapper.html().match(/foobar/g)
    expect(foobar).toHaveLength(1)
  })

  it('renders nested discriminators correctly', async () => {
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

    // Check that the first level discriminator is rendered
    const firstLevelSelector = wrapper.find('.discriminator-selector')
    expect(firstLevelSelector.exists()).toBe(true)
    expect(firstLevelSelector.text()).toContain('One of')

    // Open the first level
    await firstLevelSelector.trigger('click')
    await wrapper.vm.$nextTick()

    // Check that the nested discriminator is rendered
    const nestedSelector = wrapper.find('.discriminator-panel .discriminator-selector')
    expect(nestedSelector.exists()).toBe(true)
    expect(nestedSelector.text()).toContain('One of')

    // Check that the titles are displayed correctly
    expect(wrapper.html()).toContain('foo (1)')
    expect(wrapper.html()).toContain('bar (1)')
  })
})
