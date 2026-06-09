import { describe, expect, it } from 'vitest'

import { parsePreferHeader } from './parse-prefer-header'

describe('parsePreferHeader', () => {
  it('returns an empty object when the header is missing', () => {
    expect(parsePreferHeader(undefined)).toEqual({})
    expect(parsePreferHeader(null)).toEqual({})
    expect(parsePreferHeader('')).toEqual({})
  })

  it('parses a single directive', () => {
    expect(parsePreferHeader('code=404')).toEqual({ code: '404' })
  })

  it('parses multiple comma-separated directives', () => {
    expect(parsePreferHeader('code=404, example=notFound')).toEqual({
      code: '404',
      example: 'notFound',
    })
  })

  it('parses semicolon-separated parameters', () => {
    expect(parsePreferHeader('code=201; example=created')).toEqual({
      code: '201',
      example: 'created',
    })
  })

  it('trims surrounding whitespace', () => {
    expect(parsePreferHeader('  code = 200 ')).toEqual({ code: '200' })
  })

  it('lower-cases directive keys', () => {
    expect(parsePreferHeader('Code=200')).toEqual({ code: '200' })
  })

  it('strips quotes from values', () => {
    expect(parsePreferHeader('example="not found"')).toEqual({ example: 'not found' })
  })

  it('ignores valueless tokens', () => {
    expect(parsePreferHeader('respond-async, code=200')).toEqual({ code: '200' })
  })
})
