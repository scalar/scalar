// @vitest-environment node

import { describe, expect, it } from 'vitest'

import { readRaml } from './raml'

// RAML 1.0: Type Declarations, Property Declarations, Built-in Types,
// Determine Default Types, Type Expressions, and Typed Fragments.
// https://github.com/raml-org/raml-spec/blob/master/versions/raml-10/raml-10.md
describe('raml-specification', () => {
  it.each([
    'any',
    'nil',
    'boolean',
    'string',
    'number',
    'integer',
    'object',
    'array',
    'file',
    'date-only',
    'time-only',
    'datetime-only',
    'datetime',
  ])('preserves the built-in type %s in string and object declarations', (type) => {
    expect(readRaml(type).nodes[0]?.type).toBe(type)
    expect(readRaml({ type })).toStrictEqual(readRaml(type))
  })

  it.each([
    [{}, 'string'],
    [null, 'string'],
    [{ description: 'A value' }, 'string'],
    [{ properties: {} }, 'object'],
    [{ properties: null }, 'object'],
    [{ additionalProperties: false }, 'object'],
    [{ minProperties: 1 }, 'object'],
    [{ items: 'string' }, 'array'],
    [{ minItems: 1 }, 'array'],
    [{ uniqueItems: true }, 'array'],
    [{ fileTypes: ['image/png'] }, 'file'],
    [{ pattern: '^a' }, 'string'],
  ])('infers default types from declaration facets: %j', (declaration, type) => {
    expect(readRaml(declaration).nodes[0]?.type).toBe(type)
  })

  it('treats null property declarations as strings', () => {
    expect(readRaml('properties:\n  name:\n  age?:').nodes[0]?.children).toStrictEqual([
      { name: 'name', type: 'string', required: true },
      { name: 'age', type: 'string', required: false },
    ])
  })

  it('keeps the question mark literal when required is explicit', () => {
    expect(
      readRaml({
        properties: {
          'a?': { type: 'string', required: true },
          'b?': { type: 'string', required: false },
          'c??': 'string',
        },
      }).nodes[0]?.children,
    ).toStrictEqual([
      { name: 'a?', type: 'string', required: true },
      { name: 'b?', type: 'string', required: false },
      { name: 'c?', type: 'string', required: false },
    ])
  })

  it('accepts the schema alias but rejects simultaneous schema and type facets', () => {
    expect(readRaml({ schema: 'integer' })).toStrictEqual(readRaml({ type: 'integer' }))
    expect(() => readRaml({ schema: 'integer', type: 'integer' })).toThrow()
  })

  it('preserves array precedence and explicit grouping', () => {
    expect(readRaml('string | number[]').nodes[0]).toStrictEqual({
      name: 'Schema',
      type: 'union',
      children: [
        { name: 'Variant 1', type: 'string' },
        { name: 'Variant 2', type: 'array', children: [{ name: 'Items', type: 'number' }] },
      ],
    })
    expect(readRaml('(string | number)[]').nodes[0]).toStrictEqual({
      name: 'Schema',
      type: 'array',
      children: [
        {
          name: 'Items',
          type: 'union',
          children: [
            { name: 'Variant 1', type: 'string' },
            { name: 'Variant 2', type: 'number' },
          ],
        },
      ],
    })
    expect(readRaml('string[][]').nodes[0]).toStrictEqual({
      name: 'Schema',
      type: 'array',
      children: [{ name: 'Items', type: 'array', children: [{ name: 'Items', type: 'string' }] }],
    })
  })

  it.each([
    '| string',
    'string |',
    'string || nil',
    '()',
    '(string',
    'string)',
    'string[',
    'string[ ]',
    'string number',
    'String',
    'null',
    'Missing',
    'string & number',
  ])('rejects invalid or unresolved expressions: %s', (type) => {
    expect(() => readRaml({ type })).toThrow()
  })

  it('allows common union facets while rejecting facets unavailable on a member', () => {
    expect(readRaml({ type: 'number | integer', minimum: 1 }).nodes[0]?.details).toStrictEqual(['minimum: 1'])
    expect(() => readRaml({ type: 'number | string', minimum: 1 })).toThrow()
  })

  it.each([
    { type: 'string', minLength: 2, maxLength: 10, pattern: '^[a-z]+$' },
    { type: 'integer', minimum: -3, maximum: 5, format: 'int8', multipleOf: 1 },
    { type: 'number', minimum: -1.1, maximum: 20.9, format: 'float', multipleOf: 1.1 },
    { type: 'array', items: 'string', minItems: 0, maxItems: 4, uniqueItems: true },
    { type: 'file', fileTypes: ['*/*'], maxLength: 1024 },
    { type: 'datetime', format: 'rfc3339' },
    { type: 'datetime', format: 'rfc2616' },
    { type: 'object', minProperties: 0, maxProperties: 2, additionalProperties: false },
    { type: 'string', enum: ['red', 'blue'], default: 'red', example: 'blue' },
  ])('preserves valid built-in facets: %j', (declaration) => {
    const expected = Object.entries(declaration)
      .filter(([key]) => !['type', 'items'].includes(key))
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    expect(readRaml(declaration).nodes[0]?.details).toStrictEqual(expected)
  })

  it.each([
    { type: 'boolean', minLength: 1 },
    { type: 'string', minimum: 1 },
    { type: 'object', items: 'string' },
    { type: 'array', properties: {} },
    { type: 'string', minLength: -1 },
    { type: 'string', maxLength: 1.5 },
    { type: 'string', minLength: 10, maxLength: 2 },
    { type: 'array', uniqueItems: 'true' },
    { type: 'object', additionalProperties: {} },
    { type: 'number', minimum: '0' },
    { type: 'number', maximum: Number.POSITIVE_INFINITY },
    { type: 'number', minimum: 2, maximum: 1 },
    { type: 'number', multipleOf: 0 },
    { type: 'number', multipleOf: -1 },
    { type: 'number', format: 'decimal' },
    { type: 'datetime', format: 'iso8601' },
    { type: 'date-only', format: 'rfc3339' },
    { type: 'file', fileTypes: [42] },
    { type: 'string', pattern: 42 },
    { type: 'string', enum: 'red' },
    { type: 'string', description: 42 },
    { type: 'string', displayName: false },
    { type: 'string', example: 'a', examples: { b: 'b' } },
    { properties: { id: { type: 'integer', required: 'true' } } },
    { properties: { id: 'integer', 'id?': 'integer' } },
  ])('rejects incompatible or malformed facets: %j', (declaration) => {
    expect(() => readRaml(declaration)).toThrow()
  })

  it.each([
    'type: !include external.raml',
    'type: !unknown string',
    '#%RAML 0.8\ntype: string',
    '#%RAML 1.0 Library\ntypes: {}',
    '#%RAML 1.0\ntitle: API',
    'type: string\ntype: number',
    'type: string\n---\ntype: number',
    'properties: &loop\n  loop: *loop',
    { type: ['object', 'string'] },
    { type: 'object', uses: { lib: 'lib.raml' } },
    { type: 'object', properties: { '/^id/': 'string' } },
    { type: 'object', discriminator: 'kind', properties: { kind: 'string' } },
    { type: 'string', facets: { custom: 'boolean' }, custom: true },
    { type: 'string', xml: { attribute: true } },
    { type: 'object', types: { Local: 'string' } },
  ])('keeps unsupported constructs and malformed YAML on the source path: %j', (source) => {
    expect(() => readRaml(source)).toThrow()
  })

  it('accepts a DataType fragment and bounds nested type expressions', () => {
    expect(readRaml('#%RAML 1.0 DataType\ntype: string')).toStrictEqual(readRaml('string'))
    expect(() => readRaml({ type: `${'('.repeat(100)}string${')'.repeat(100)}` })).toThrow()
  })
  it.each([
    '#%RAML 0.8\n#%RAML 1.0 DataType\ntype: string',
    '# comment\n#%RAML 1.0 DataType\ntype: string',
    { type: 'string', required: false },
    { properties: {}, items: 'string' },
    { type: { type: 'string', minLength: 2 } },
  ])('falls back for conflicting fragments or unsupported inline refinement: %j', (source) => {
    expect(() => readRaml(source)).toThrow()
  })

  it('preserves YAML aliases without treating shared objects as recursive', () => {
    expect(readRaml('properties:\n  a: &type\n    type: string\n  b: *type').nodes[0]?.children).toStrictEqual([
      { name: 'a', type: 'string', required: true },
      { name: 'b', type: 'string', required: true },
    ])
  })

  it('handles multiline YAML documentation and JSON-formatted declarations', () => {
    expect(readRaml('type: string\ndescription: |\n  First line\n  Second line\n').nodes[0]?.description).toBe(
      'First line\nSecond line\n',
    )
    expect(readRaml('{"type":"integer","minimum":0}').nodes[0]).toStrictEqual({
      name: 'Schema',
      type: 'integer',
      details: ['minimum: 0'],
    })
  })

  it('bounds wide declarations and repeated array qualifiers', () => {
    expect(() =>
      readRaml({ properties: Object.fromEntries(Array.from({ length: 2100 }, (_, i) => [`f${i}`, 'string'])) }),
    ).toThrow()
    expect(() => readRaml({ type: `string${'[]'.repeat(100)}` })).toThrow()
  })
})
