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
})
