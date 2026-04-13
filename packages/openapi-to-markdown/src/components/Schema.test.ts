// @vitest-environment jsdom
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Schema from './Schema.vue'

const schema = (value: Record<string, unknown>) => value as SchemaObject

describe('Schema', () => {
  it('renders composition keywords (allOf)', () => {
    const schemaValue = schema({
      allOf: [
        { type: 'object', properties: { name: { type: 'string' } } },
        { type: 'object', properties: { age: { type: 'number' } } },
      ],
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('All of:')
    expect(wrapper.text()).toContain('name')
    expect(wrapper.text()).toContain('age')
  })

  it('renders composition keywords (anyOf)', () => {
    const schemaValue = schema({
      anyOf: [{ type: 'string' }, { type: 'number' }],
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('Any of:')
    expect(wrapper.text()).toContain('string')
    expect(wrapper.text()).toContain('number')
  })

  it('renders composition keywords (oneOf)', () => {
    const schemaValue = schema({
      oneOf: [{ type: 'boolean' }, { type: 'integer' }],
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('One of:')
    expect(wrapper.text()).toContain('boolean')
    expect(wrapper.text()).toContain('integer')
  })

  it('renders composition keywords (not)', () => {
    const schemaValue = schema({
      not: { type: 'string' },
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('Not:')
    expect(wrapper.text()).toContain('string')
  })

  it('renders object type schema with properties', () => {
    const schemaValue = schema({
      type: 'object',
      properties: {
        name: { type: 'string', description: 'User name' },
        age: { type: 'number', description: 'User age' },
      },
      required: ['name'],
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('name')
    expect(wrapper.text()).toContain('(required)')
    expect(wrapper.text()).toContain('User name')
    expect(wrapper.text()).toContain('age')
    expect(wrapper.text()).toContain('User age')
  })

  it('renders array type schema with items', () => {
    const schemaValue = schema({
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
      uniqueItems: true,
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('Array of:')
    expect(wrapper.text()).toContain('string')
    expect(wrapper.text()).toContain('Min items: 1')
    expect(wrapper.text()).toContain('Max items: 10')
    expect(wrapper.text()).toContain('Unique items: true')
  })

  it('renders primitive type schema with format and enum', () => {
    const schemaValue = schema({
      type: 'string',
      format: 'email',
      enum: ['user@example.com', 'admin@example.com'],
      default: 'user@example.com',
      description: 'User email address',
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('string')
    expect(wrapper.text()).toContain('format: email')
    expect(wrapper.text()).toContain('possible values: "user@example.com", "admin@example.com"')
    expect(wrapper.text()).toContain('default: "user@example.com"')
    expect(wrapper.text()).toContain('User email address')
  })

  it('renders nested object schema', () => {
    const schemaValue = schema({
      type: 'object',
      properties: {
        user: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
          },
        },
      },
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('user')
    expect(wrapper.text()).toContain('name')
    expect(wrapper.text()).toContain('address')
    expect(wrapper.text()).toContain('street')
    expect(wrapper.text()).toContain('city')
  })

  it('renders array of objects schema', () => {
    const schemaValue = schema({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    })

    const wrapper = mount(Schema, {
      props: { schema: schemaValue },
    })

    expect(wrapper.text()).toContain('Array of:')
    expect(wrapper.text()).toContain('id')
    expect(wrapper.text()).toContain('name')
  })
})
