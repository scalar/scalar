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
})
