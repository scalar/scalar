import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { createSchemaRenderer } from './render-schema'

const render = (value: SchemaObject): string =>
  unified()
    .use(remarkStringify, { bullet: '-' })
    .stringify({ type: 'root', children: createSchemaRenderer().render(value) })

const schema = (value: Record<string, unknown>) => value as SchemaObject

describe('render-schema', () => {
  it('renders composition keywords (allOf)', () => {
    const schemaValue = schema({
      allOf: [
        { type: 'object', properties: { name: { type: 'string' } } },
        { type: 'object', properties: { age: { type: 'number' } } },
      ],
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('All of:')
    expect(output.replaceAll('`', '')).toContain('name')
    expect(output.replaceAll('`', '')).toContain('age')
  })

  it('renders composition keywords (anyOf)', () => {
    const schemaValue = schema({
      anyOf: [{ type: 'string' }, { type: 'number' }],
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('Any of:')
    expect(output.replaceAll('`', '')).toContain('string')
    expect(output.replaceAll('`', '')).toContain('number')
  })

  it('renders composition keywords (oneOf)', () => {
    const schemaValue = schema({
      oneOf: [{ type: 'boolean' }, { type: 'integer' }],
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('One of:')
    expect(output.replaceAll('`', '')).toContain('boolean')
    expect(output.replaceAll('`', '')).toContain('integer')
  })

  it('renders composition keywords (not)', () => {
    const schemaValue = schema({
      not: { type: 'string' },
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('Not:')
    expect(output.replaceAll('`', '')).toContain('string')
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

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('name')
    expect(output.replaceAll('`', '')).toContain('(required)')
    expect(output.replaceAll('`', '')).toContain('User name')
    expect(output.replaceAll('`', '')).toContain('age')
    expect(output.replaceAll('`', '')).toContain('User age')
  })

  it('renders array type schema with items', () => {
    const schemaValue = schema({
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 10,
      uniqueItems: true,
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('Array of:')
    expect(output.replaceAll('`', '')).toContain('string')
    expect(output.replaceAll('`', '')).toContain('Min items: 1')
    expect(output.replaceAll('`', '')).toContain('Max items: 10')
    expect(output.replaceAll('`', '')).toContain('Unique items: true')
  })

  it('renders primitive type schema with format and enum', () => {
    const schemaValue = schema({
      type: 'string',
      format: 'email',
      enum: ['user@example.com', 'admin@example.com'],
      default: 'user@example.com',
      description: 'User email address',
    })

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('string')
    expect(output.replaceAll('`', '')).toContain('format: email')
    expect(output.replaceAll('`', '')).toContain('possible values: "user@example.com", "admin@example.com"')
    expect(output.replaceAll('`', '')).toContain('default: "user@example.com"')
    expect(output.replaceAll('`', '')).toContain('User email address')
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

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('user')
    expect(output.replaceAll('`', '')).toContain('name')
    expect(output.replaceAll('`', '')).toContain('address')
    expect(output.replaceAll('`', '')).toContain('street')
    expect(output.replaceAll('`', '')).toContain('city')
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

    const output = render(schemaValue)

    expect(output.replaceAll('`', '')).toContain('Array of:')
    expect(output.replaceAll('`', '')).toContain('id')
    expect(output.replaceAll('`', '')).toContain('name')
  })
  it('reuses normalized views without conflating reference sibling overrides', () => {
    const renderer = createSchemaRenderer()
    const target = { type: 'string', description: 'Base' }
    const first = schema({ $ref: '#/components/schemas/Value', '$ref-value': target, description: 'First' })
    const second = schema({ $ref: '#/components/schemas/Value', '$ref-value': target, description: 'Second' })
    expect(renderer.view(first)).toBe(renderer.view(first))
    expect(renderer.view(first).description).toBe('First')
    expect(renderer.view(second).description).toBe('Second')
    expect(target).toStrictEqual({ type: 'string', description: 'Base' })
  })

  it('does not reuse ancestry-dependent expansions across separate roots', () => {
    const renderer = createSchemaRenderer()
    const value = schema({ type: 'object', properties: { value: { type: 'string' } } })
    const serialize = (depth: number): string =>
      unified()
        .use(remarkStringify, { bullet: '-' })
        .stringify({ type: 'root', children: renderer.render(value, depth) })
    expect(serialize(10)).toBe('*\\[Circular Reference]*\n')
    expect(serialize(0)).toBe('- **`value`**\n\n  `string`\n')
  })
})
