import { describe, expect, it } from 'vitest'

import { getResponseHeaderExample } from './get-response-header-example'

describe('getResponseHeaderExample', () => {
  it('generates a value from the schema', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer', example: 7 } })).toBe(7)
  })

  it('prefers the header example over the schema', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer' }, example: 42 })).toBe(42)
  })

  it('uses the first examples entry', () => {
    expect(
      getResponseHeaderExample({ schema: { type: 'integer' }, examples: { low: { value: 10 }, high: { value: 99 } } }),
    ).toBe(10)
  })

  it('keeps falsy authored examples', () => {
    expect(getResponseHeaderExample({ schema: { type: 'integer' }, example: 0 })).toBe(0)
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

  it('returns undefined when nothing describes the value', () => {
    expect(getResponseHeaderExample({ description: 'No value' })).toBeUndefined()
    expect(getResponseHeaderExample(undefined)).toBeUndefined()
  })
})
