import { describe, expect, it } from 'vitest'

import { getResponseHeaderExample } from './get-response-header-example'

describe('get-response-header-example', () => {
  it('generates a value from the schema', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer', example: 7 } })).toBe('7')
  })

  it('prefers the header example over the schema', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer' }, example: 42 })).toBe('42')
  })

  it('uses the first examples entry', () => {
    expect(
      getResponseHeaderExample({ schema: { type: 'integer' }, examples: { low: { value: 10 }, high: { value: 99 } } }),
    ).toBe('10')
  })

  it('generates from the schema when the first example has no payload', () => {
    expect(
      getResponseHeaderExample({
        schema: { type: 'integer', example: 7 },
        examples: { first: { summary: 'Description only' }, second: { value: 42 } },
      }),
    ).toBe('7')
  })

  it('serializes schema-based data examples using the header style', () => {
    expect(
      getResponseHeaderExample({
        schema: { type: 'object' },
        explode: true,
        examples: { authored: { dataValue: { red: 100, green: 200 } } },
      }),
    ).toBe('red=100,green=200')
  })

  it('keeps falsy authored examples', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer' }, example: 0 })).toBe('0')
    expect(getResponseHeaderExample({ schema: { type: 'string' }, example: '' })).toBe('')
  })

  it('reads headers described by content', () => {
    expect(getResponseHeaderExample({ content: { 'text/plain': { example: 'abc' } } })).toBe('abc')
    expect(
      getResponseHeaderExample({ content: { 'text/plain': { examples: { a: { value: 'from-examples' } } } } }),
    ).toBe('from-examples')
    expect(
      getResponseHeaderExample({ content: { 'text/plain': { schema: { type: 'string', example: 'gen' } } } }),
    ).toBe('gen')
  })

  it('uses the media type example when the header examples map is empty', () => {
    expect(getResponseHeaderExample({ examples: {}, content: { 'text/plain': { example: 'from-content' } } })).toBe(
      'from-content',
    )
  })

  it('serializes a generated header value using its media type', () => {
    expect(
      getResponseHeaderExample({
        content: {
          'application/json': { schema: { type: 'array', items: { type: 'integer' }, example: [1, 2] } },
        },
      }),
    ).toBe('[1,2]')
  })

  it('returns undefined when nothing describes the value', () => {
    expect(getResponseHeaderExample({ description: 'No value' })).toBeUndefined()
    expect(getResponseHeaderExample(undefined)).toBeUndefined()
  })
})
