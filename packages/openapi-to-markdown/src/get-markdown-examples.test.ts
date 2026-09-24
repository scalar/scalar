import { describe, expect, it } from 'vitest'

import { countGeneratedExampleValues, getMarkdownExamples } from './get-markdown-examples'

const schema = { type: 'string', example: 'schema fallback' }

describe('get-markdown-examples', () => {
  it.each([null, false, 0, '', { value: 'literal' }])(
    'preserves the supplied value %j without generating a replacement',
    (value) => {
      expect(getMarkdownExamples({ schema, example: value }, 'application/json')).toStrictEqual([{ value }])
    },
  )

  it('preserves every named example, reference metadata, and external value', () => {
    expect(
      getMarkdownExamples(
        {
          schema,
          examples: {
            first: { summary: 'First example', description: 'A **literal** value.', value: false },
            second: { $ref: '#/components/examples/Second', '$ref-value': { value: { id: 42 } } },
            remote: { externalValue: 'https://example.com/payload.json' },
          },
        },
        'application/json',
      ),
    ).toStrictEqual([
      { name: 'first', summary: 'First example', description: 'A **literal** value.', value: false },
      { name: 'second', summary: undefined, description: undefined, value: { id: 42 } },
      { name: 'remote', summary: undefined, description: undefined, externalValue: 'https://example.com/payload.json' },
    ])
  })

  it('does not replace unresolved supplied examples with invented values', () => {
    expect(
      getMarkdownExamples({ schema, examples: { missing: { $ref: '#/missing' } } }, 'application/json'),
    ).toStrictEqual([])
  })

  it('generates examples using the request or response direction', () => {
    const source = {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'integer', readOnly: true, example: 42 },
          secret: { type: 'string', writeOnly: true, example: 'secret' },
          name: { type: 'string', example: 'Ada' },
        },
      },
    }
    expect(getMarkdownExamples(source, 'application/json', 'write')).toStrictEqual([
      { value: { secret: 'secret', name: 'Ada' } },
    ])
    expect(getMarkdownExamples(source, 'application/json', 'read')).toStrictEqual([{ value: { id: 42, name: 'Ada' } }])
  })

  it('preserves supplied XML as a string', () => {
    expect(getMarkdownExamples({ example: '<Pet id="42" />' }, 'application/xml')).toStrictEqual([
      { value: '<Pet id="42" />' },
    ])
  })
  it.each([null, false, 0, ''])('preserves an OpenAPI 3.2 dataValue of %j', (value) => {
    expect(getMarkdownExamples({ examples: { supplied: { dataValue: value } } }, 'application/json')).toStrictEqual([
      { name: 'supplied', summary: undefined, description: undefined, value },
    ])
  })

  it('prefers supplied serialization or an external value over dataValue', () => {
    expect(
      getMarkdownExamples(
        {
          examples: {
            serialized: { dataValue: { id: 42 }, serializedValue: '<Pet id="42" />' },
            external: { dataValue: { id: 42 }, externalValue: 'https://example.com/pet.xml' },
          },
        },
        'application/xml',
      ),
    ).toStrictEqual([
      { name: 'serialized', summary: undefined, description: undefined, serializedValue: '<Pet id="42" />' },
      { name: 'external', summary: undefined, description: undefined, externalValue: 'https://example.com/pet.xml' },
    ])
  })

  it.each(['3.0.4', '3.1.2'])('does not apply OpenAPI 3.2 example fields to %s', (version) => {
    expect(
      getMarkdownExamples(
        {
          examples: {
            data: { dataValue: false },
            serialized: { serializedValue: '<ok/>' },
            legacy: { value: 0 },
          },
        },
        'application/json',
        undefined,
        version,
      ),
    ).toStrictEqual([{ name: 'legacy', summary: undefined, description: undefined, value: 0 }])
  })

  it('skips a generated example that would repeat a densely shared schema graph', () => {
    const levels = Array.from({ length: 12 }, () => ({ type: 'object', properties: {} as Record<string, unknown> }))
    levels.forEach((level, index) => {
      for (let branch = 0; branch < 5; branch++) {
        level.properties[`p${branch}`] =
          index < 11 ? { $ref: `#/L${index + 1}`, '$ref-value': levels[index + 1] } : { type: 'string' }
      }
    })
    expect(countGeneratedExampleValues(levels[0])).toBeGreaterThan(10_000)
    expect(getMarkdownExamples({ schema: levels[0] }, 'application/json')).toStrictEqual([{ omitted: true }])
    expect(getMarkdownExamples({ schema: levels[11] }, 'application/json')).toStrictEqual([
      { value: { p0: '', p1: '', p2: '', p3: '', p4: '' } },
    ])
  })

  it('counts each generated value once per level, following the first variant of a choice', () => {
    const shared = { type: 'object', properties: { id: { type: 'string' } } }
    expect(
      countGeneratedExampleValues({
        type: 'object',
        properties: { first: shared, second: shared },
        anyOf: [{ type: 'string' }, shared],
      }),
    ).toBe(1 + 2 + 2 + 1)
  })
  it.each(['anyOf', 'oneOf'])('bounds a non-null %s variant after a null variant', (keyword) => {
    const properties = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`p${i}`, { type: 'string' }]))
    const schema = { [keyword]: [{ type: 'null' }, { type: 'object', properties }] }
    expect(getMarkdownExamples({ schema }, 'application/json')).toStrictEqual([{ omitted: true }])
  })

  it('bounds pattern properties and structural reference siblings', () => {
    const properties = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`p${i}`, { type: 'string' }]))
    expect(
      getMarkdownExamples({ schema: { type: 'object', patternProperties: properties } }, 'application/json'),
    ).toStrictEqual([{ omitted: true }])
    expect(
      getMarkdownExamples(
        {
          schema: {
            $ref: '#/components/schemas/Base',
            '$ref-value': { type: 'object' },
            properties,
          },
        },
        'application/json',
      ),
    ).toStrictEqual([{ omitted: true }])
  })

  it('preserves a supplied schema example without expanding its large schema', () => {
    const properties = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`p${i}`, { type: 'string' }]))
    expect(
      getMarkdownExamples({ schema: { type: 'object', properties, example: { id: 'supplied' } } }, 'application/json'),
    ).toStrictEqual([{ value: { id: 'supplied' } }])
  })
  it('bounds a discriminator-selected variant beyond the first member', () => {
    const properties = Object.fromEntries(Array.from({ length: 10_001 }, (_, i) => [`p${i}`, { type: 'string' }]))
    const schema = {
      oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Large', '$ref-value': { type: 'object', properties } }],
      discriminator: { propertyName: 'kind', defaultMapping: 'Large' },
    }
    expect(getMarkdownExamples({ schema }, 'application/json')).toStrictEqual([{ omitted: true }])
  })
})
