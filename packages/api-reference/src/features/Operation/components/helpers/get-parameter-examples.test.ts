import { getRenderedExample, normalizeRenderedExamples } from '@scalar/blocks/schema/helpers'
import { describe, expect, it } from 'vitest'

import { getParameterExamples } from './get-parameter-examples'

describe('get-parameter-examples', () => {
  it('resolves external-only examples without dropping their URL', () => {
    expect(
      getParameterExamples({
        parameter: {
          name: 'cookie',
          in: 'header',
          examples: {
            external: {
              $ref: '#/components/examples/Cookie',
              '$ref-value': { externalValue: 'https://example.com/cookie.txt' },
            },
          },
        },
      }),
    ).toStrictEqual([getRenderedExample({ value: 'https://example.com/cookie.txt' }, 'external')])
  })

  it('unwraps named parameter examples without losing false or null', () => {
    expect(
      getParameterExamples({
        parameter: {
          name: 'term',
          in: 'query',
          examples: {
            data: { dataValue: { id: 1 } },
            wire: { serializedValue: 'term=a%20b' },
            no: { dataValue: false },
            empty: { dataValue: null },
          },
        },
      }),
    ).toStrictEqual([
      getRenderedExample({ value: { id: 1 } }, 'data'),
      getRenderedExample({ value: 'term=a%20b' }, 'wire'),
      getRenderedExample({ value: false }, 'no'),
      getRenderedExample({ value: null }, 'empty'),
    ])
  })

  it('renders querystring data examples and prefers parameter examples', () => {
    expect(
      getParameterExamples({
        parameter: {
          name: 'metadata',
          in: 'querystring',
          content: { 'application/json': {} },
          examples: { default: { dataValue: false, serializedValue: 'false' }, wire: { serializedValue: '%7B%7D' } },
        },
        content: { examples: { default: { dataValue: true }, other: { dataValue: 'media' } } },
      }),
    ).toStrictEqual([getRenderedExample({ value: false }, 'default'), getRenderedExample({ value: '%7B%7D' }, 'wire')])
  })

  it('preserves object fields named value and externalValue for the example renderer', () => {
    const value = { value: 'abc', externalValue: 'local', unit: 'kg' }
    expect(
      getParameterExamples({
        parameter: {
          name: 'search',
          in: 'querystring',
          content: { 'application/json': {} },
          examples: { default: { dataValue: value } },
        },
      }),
    ).toStrictEqual([getRenderedExample({ value }, 'default')])
  })

  it.each([undefined, { first: { value: undefined } }, { first: { $ref: '#/components/examples/Missing' } }])(
    'ignores unavailable parameter examples: %j',
    (examples) => {
      expect(getParameterExamples({ parameter: { in: 'query', name: 'term', examples } })).toStrictEqual([])
    },
  )

  it('falls back to media type examples when parameter examples is an array', () => {
    const parameter = { in: 'query', name: 'term' } as const
    expect(
      getParameterExamples({
        // @ts-expect-error Malformed API descriptions can supply an array instead of a named map.
        parameter: { ...parameter, examples: ['first', 'second'] },
        content: { example: 'media' },
      }),
    ).toStrictEqual(normalizeRenderedExamples(['media']))
  })

  it.each([false, 0, '', null])('preserves a singular parameter example: %j', (example) => {
    expect(getParameterExamples({ parameter: { in: 'query', name: 'term', example } })).toStrictEqual(
      normalizeRenderedExamples([example]),
    )
  })

  it('preserves names and summaries without appending media type examples', () => {
    const examples = getParameterExamples({
      parameter: {
        name: 'status',
        in: 'query',
        examples: {
          active: { summary: 'Active records', value: 'active' },
          archived: { value: 'archived' },
        },
      },
      content: { examples: { other: { value: 'media' } } },
    })
    expect(examples.map(({ name, summary, value }) => ({ name, summary, value }))).toStrictEqual([
      { name: 'active', summary: 'Active records', value: 'active' },
      { name: 'archived', summary: undefined, value: 'archived' },
    ])
  })

  it.each([false, 0, '', null])(
    'uses a singular media type example when parameter examples are unavailable: %j',
    (example) => {
      expect(
        getParameterExamples({
          parameter: { name: 'term', in: 'query', examples: { empty: { value: undefined } } },
          content: { example },
        }),
      ).toStrictEqual(normalizeRenderedExamples([example]))
    },
  )

  it('preserves named media type example metadata for responses', () => {
    expect(
      getParameterExamples({
        parameter: { description: 'OK' },
        content: { examples: { sample: { summary: 'Response sample', value: { value: 'payload', summary: 'data' } } } },
      }),
    ).toStrictEqual([
      getRenderedExample({ summary: 'Response sample', value: { value: 'payload', summary: 'data' } }, 'sample'),
    ])
  })
})
