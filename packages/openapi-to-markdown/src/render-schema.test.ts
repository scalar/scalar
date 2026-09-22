import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { describe, expect, it } from 'vitest'

import { createSchemaRenderer } from './render-schema'

const render = (value: SchemaObject | boolean, depth = 0): string =>
  unified()
    .use(remarkStringify, { bullet: '-' })
    .stringify({ type: 'root', children: createSchemaRenderer().render(value, depth) })

const renderText = (value: SchemaObject | boolean, depth = 0): string =>
  render(value, depth).replaceAll('`', '').replaceAll('**', '').replaceAll('\\[', '[').trim()

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

  it('preserves the type of an array without an items schema', () => {
    expect(renderText(schema({ type: 'array' }))).toBe('array')
  })

  it('preserves nullable array types alongside their items', () => {
    expect(render(schema({ type: ['array', 'null'], items: { type: 'string' } }))).toBe(
      '`array | null`\n\n**Array of:**\n\n`string`\n',
    )
  })

  it('preserves nullable object types alongside their properties', () => {
    expect(render(schema({ type: ['object', 'null'], properties: { name: { type: 'string' } } }))).toBe(
      '`object | null`\n\n- **`name`**\n\n  `string`\n',
    )
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
    const serialize = (ancestors: readonly unknown[]): string =>
      unified()
        .use(remarkStringify, { bullet: '-' })
        .stringify({ type: 'root', children: renderer.render(value, 0, ancestors) })
    expect(serialize([value])).toBe('*\\[Circular Reference]*\n')
    expect(serialize([])).toBe('- **`value`**\n\n  `string`\n')
  })
  it.each(['allOf', 'anyOf', 'oneOf'] as const)('renders %s inside an object property', (keyword) => {
    const output = renderText(
      schema({
        type: 'object',
        properties: {
          choice: {
            [keyword]: [
              { type: 'string', format: 'uuid' },
              { type: 'integer', format: 'int64' },
            ],
          },
        },
      }),
    )
    expect(output).toContain('uuid')
    expect(output).toContain('int64')
  })

  it('renders not inside an object property', () => {
    const output = renderText(
      schema({ type: 'object', properties: { choice: { not: { type: 'string', enum: ['forbidden'] } } } }),
    )
    expect(output).toContain('Not:')
    expect(output).toContain('"forbidden"')
  })

  it('preserves zero bounds and constraints on object properties', () => {
    const output = renderText(
      schema({
        type: 'object',
        properties: {
          count: { type: 'integer', minimum: 0, maximum: 10, multipleOf: 2 },
          name: { type: 'string', minLength: 0, maxLength: 20, pattern: '^[a-z]+$' },
        },
      }),
    )
    const text = output.replace(/\s+/g, ' ')
    expect(text).toContain('minimum: 0')
    expect(text).toContain('maximum: 10')
    expect(text).toContain('multipleOf: 2')
    expect(text).toContain('minLength: 0')
    expect(text).toContain('maxLength: 20')
    expect(text).toContain('pattern: ^[a-z]+$')
  })
  it('retains sibling properties alongside multiple composition keywords', () => {
    const output = renderText(
      schema({
        type: 'object',
        properties: { sibling: { type: 'string' } },
        allOf: [{ properties: { inherited: { type: 'integer' } } }],
        oneOf: [{ properties: { first: { type: 'boolean' } } }, { properties: { second: { type: 'number' } } }],
      }),
    )
    for (const expected of ['sibling', 'inherited', 'first', 'second', 'All of:', 'One of:']) {
      expect(output).toContain(expected)
    }
  })

  it('renders access annotations, additional properties, constants, and discriminator mappings', () => {
    const output = renderText(
      schema({
        type: 'object',
        additionalProperties: { type: 'integer' },
        discriminator: { propertyName: 'kind', mapping: { cat: '#/components/schemas/Cat' } },
        properties: {
          id: { type: 'string', readOnly: true },
          secret: { type: 'string', writeOnly: true },
          kind: { const: 'cat' },
        },
      }),
    )
    const text = output.replace(/\s+/g, ' ')
    for (const expected of [
      'readOnly',
      'writeOnly',
      'Additional properties:',
      'integer',
      'Discriminator:',
      'kind',
      '#/components/schemas/Cat',
      'const: "cat"',
    ]) {
      expect(text).toContain(expected)
    }
  })

  it.each([true, false])('renders a boolean schema %s without coercing it to an object', (value) => {
    expect(renderText(value)).toBe(value ? 'any (true schema)' : 'never (false schema)')
  })

  it('renders false schemas inside composition and array items', () => {
    const output = renderText(
      schema({
        type: 'array',
        items: false,
        not: false,
        allOf: [true, false],
      }),
    )
    const text = output
    expect(text).toContain('Array of:')
    expect(text).toContain('Not:')
    expect(text.match(/never \(false schema\)/g)?.length).toBe(3)
  })

  it('identifies actual ancestor cycles without truncating deep nonrecursive schemas', () => {
    const recursive: Record<string, unknown> = { type: 'object' }
    recursive.properties = { child: { $ref: '#/Node', '$ref-value': recursive } }
    expect(renderText(schema(recursive))).toContain('[Circular Reference]')
    const deep = Array.from({ length: 24 }).reduce<Record<string, unknown>>(
      (child, _, index) => ({ type: 'object', properties: { [`level${index}`]: child } }),
      { type: 'string', description: 'Deep leaf' },
    )
    const text = renderText(schema(deep))
    expect(text).toContain('Deep leaf')
    expect(text).not.toContain('Circular')
  })

  it('renders a shared reference in both branches without reporting a cycle', () => {
    const shared = { type: 'object', properties: { name: { type: 'string' } } }
    const output = renderText(
      schema({
        type: 'object',
        properties: {
          first: { $ref: '#/Shared', '$ref-value': shared },
          second: { $ref: '#/Shared', '$ref-value': shared },
        },
      }),
    )
    expect(output.match(/name/g)?.length).toBe(2)
    expect(output).not.toContain('Circular')
  })

  it('labels the depth guard separately from a circular reference', () => {
    const output = renderText(schema({ type: 'string' }), 64)
    expect(output).toBe('[Maximum schema depth reached]')
  })
  it.each([true, false])('preserves sibling constraints beside a reference to %s', (target) => {
    const output = renderText(schema({ $ref: '#/Base', '$ref-value': target, type: 'string', minLength: 3 }))
    expect(output).toContain('string')
    expect(output).toContain('minLength: 3')
    expect(output.includes('never (false schema)')).toBe(!target)
  })
})
