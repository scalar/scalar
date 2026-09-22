import { describe, expect, it } from 'vitest'

import { getMarkdownExamples } from './get-markdown-examples'

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
})
