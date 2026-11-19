import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { type SchemaObject, SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getExampleContent } from './get-example-content'

describe('get-example-content', () => {
  it.each([
    { openapiVersion: '3.0.4', jsonSchemaDialect: undefined, expected: [1, 1, 1] },
    { openapiVersion: '3.1.2', jsonSchemaDialect: undefined, expected: [2, 1, 1] },
    { openapiVersion: '3.1.2', jsonSchemaDialect: 'http://json-schema.org/draft-07/schema#', expected: [2, 1, 1] },
  ])('uses response document dialect: %j', ({ expected, ...options }) => {
    const schema = {
      type: 'array',
      items: { type: 'integer' },
      minItems: 3,
      maxItems: 3,
      contains: { const: 2 },
      minContains: options.jsonSchemaDialect ? 0 : 1,
      maxContains: options.jsonSchemaDialect ? 0 : 1,
    } as SchemaObject
    expect(JSON.parse(getExampleContent({ schema }, undefined, options)!)).toStrictEqual(expected)
  })

  it.each([false, true])('generates finite recursive array examples with a root reference: %s', (rootReference) => {
    const schema: SchemaObject = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string', example: 'Earth' } },
    }
    schema.properties!.planets = {
      type: 'array',
      minItems: 1,
      items: { $ref: '#/components/schemas/Planet', '$ref-value': schema },
    }
    const input = rootReference ? { $ref: '#/components/schemas/Planet', '$ref-value': schema } : schema
    expect(getExampleContent({ schema: input }, undefined)).toBe(
      JSON.stringify({ name: 'Earth', planets: [{ name: 'Earth' }] }, null, 2),
    )
  })
  it('generates examples for schemas with several references to themselves', () => {
    const schema: SchemaObject = { type: 'object', properties: { id: { type: 'integer', example: 1 } } }
    for (const name of ['a1', 'a2', 'a3', 'a4', 'a5']) {
      schema.properties![name] = { $ref: '#/components/schemas/A', '$ref-value': schema }
    }

    const content = getExampleContent({ schema: { $ref: '#/components/schemas/A', '$ref-value': schema } }, undefined)

    expect(JSON.parse(content!).a5.a5.id).toBe(1)
    expect(content!.length).toBeLessThan(100_000)
  })

  it('applies response composition selection to XML serialization', () => {
    const response = {
      schema: coerceValue(SchemaObjectSchema, {
        oneOf: [
          { type: 'object', xml: { name: 'first' }, properties: { id: { type: 'integer', example: 1 } } },
          {
            type: 'object',
            xml: { name: 'second' },
            properties: { id: { type: 'integer', example: 2, xml: { attribute: true } } },
          },
        ],
      }),
    }
    expect(
      getExampleContent(response, undefined, { contentType: 'application/xml', compositionSelection: { oneOf: 1 } }),
    ).toBe('<?xml version="1.0" encoding="UTF-8"?>\n<second id="2"/>')
  })

  it('frames structured streaming data while preserving serialized precedence', () => {
    const options = { contentType: 'application/jsonl' }
    expect(getExampleContent(undefined, { dataValue: [{ id: 1 }, { id: 2 }] }, options)).toBe('{"id":1}\n{"id":2}\n')
    expect(getExampleContent(undefined, { dataValue: [{ id: 1 }], serializedValue: 'wire\n' }, options)).toBe('wire\n')
  })

  it('keeps multipart examples available without applying JSON stream framing', () => {
    expect(getExampleContent(undefined, { value: { id: 1 } }, { contentType: 'multipart/mixed' })).toBe(
      '{\n  "id": 1\n}',
    )
  })

  it('bounds expansion of shared legacy response examples', () => {
    const value = Array.from({ length: 16 }).reduce<Record<string, unknown>>(
      (shared) => ({ left: shared, right: shared }),
      { id: 1 },
    )
    const expected = Array.from({ length: 16 }).reduce<Record<string, unknown>>(
      (left) => ({ left, right: '[Circular]' }),
      { id: 1 },
    )

    expect(getExampleContent(undefined, { value })).toBe(JSON.stringify(expected, null, 2))
  })

  it('preserves serialized content exactly for display and copy', () => {
    expect(getExampleContent(undefined, { serializedValue: '  { "id": 1 }\n', dataValue: { id: 2 } })).toBe(
      '  { "id": 1 }\n',
    )
  })

  it.each([false, 0, null, '', 'hello', '{"id":1}'])('renders structured JSON %j as data', (value) => {
    expect(getExampleContent(undefined, { dataValue: value })).toBe(JSON.stringify(value, null, 2))
  })

  it('does not JSON-quote structured text responses', () => {
    expect(getExampleContent(undefined, { dataValue: 'hello' }, { contentType: 'text/plain' })).toBe('hello')
  })

  it('preserves explicit legacy null response examples', () => {
    expect(getExampleContent(undefined, { value: null })).toBe('null')
  })

  it('keeps legacy formatted JSON examples', () => {
    expect(getExampleContent(undefined, { value: '{"id":1}' })).toBe('{\n  "id": 1\n}')
  })
  it('accepts content type and composition selection together', () => {
    const response = {
      schema: coerceValue(SchemaObjectSchema, {
        oneOf: [
          { type: 'string', const: 'first' },
          { type: 'string', const: 'second' },
        ],
      }),
    }
    const options = { contentType: 'text/plain', compositionSelection: { oneOf: 1 } }
    expect(getExampleContent(response, undefined, options)).toBe('second')
    expect(getExampleContent(response, { value: 'explicit' }, options)).toBe('explicit')
    expect(getExampleContent(response, { dataValue: 'explicit' }, options)).toBe('explicit')
    expect(
      getExampleContent(response, { dataValue: 'explicit' }, { ...options, contentType: 'application/json' }),
    ).toBe('"explicit"')
    expect(getExampleContent(response, { serializedValue: '  explicit\n' }, options)).toBe('  explicit\n')
  })
})
