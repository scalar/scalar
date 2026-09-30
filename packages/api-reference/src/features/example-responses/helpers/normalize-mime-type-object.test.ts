import { describe, expect, it } from 'vitest'

import { normalizeMimeTypeObject } from './normalize-mime-type-object'

describe('normalize-mime-type-object', () => {
  it('removes charset', () => {
    const content = {
      'application/json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('removes semicolon', () => {
    const content = {
      'application/json;': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('removes whitespace', () => {
    const content = {
      ' application/json ': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('removes mimetype variants', () => {
    const content = {
      'application/problem+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('removes mimetype variants with special characters', () => {
    const content = {
      'application/problem+json': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('removes all the clutter', () => {
    const content = {
      'application/problem-foobar+json; charset=utf-8': {},
    }

    expect(normalizeMimeTypeObject(content)).toStrictEqual({
      'application/json': {},
    })
  })

  it('preserves undefined and empty content', () => {
    expect(normalizeMimeTypeObject(undefined)).toBeUndefined()
    expect(normalizeMimeTypeObject({})).toStrictEqual({})
  })

  it('preserves media type values without mutating the source', () => {
    const mediaType = { example: 'image data' }
    const content = Object.freeze({ 'image/png; charset=utf-8': mediaType, 'text/csv': { example: 'a,b' } })
    const result = normalizeMimeTypeObject(content)

    expect(result).toStrictEqual({ 'image/png': mediaType, 'text/csv': { example: 'a,b' } })
    expect(result?.['image/png']).toBe(mediaType)
    expect(content).toStrictEqual({ 'image/png; charset=utf-8': mediaType, 'text/csv': { example: 'a,b' } })
  })

  it.each([
    ['application/json', 'application/json; charset=utf-8'],
    ['application/json; charset=utf-8', 'application/json'],
    ['application/problem+json', 'application/json; charset=utf-8'],
  ])('uses the last value when %s and %s normalize to the same key', (first, last) => {
    expect(normalizeMimeTypeObject({ [first]: { example: 'first' }, [last]: { example: 'last' } })).toStrictEqual({
      'application/json': { example: 'last' },
    })
  })

  it('preserves keys that normalize to an empty string', () => {
    expect(normalizeMimeTypeObject({ '': {}, ' ; charset=utf-8': {} })).toStrictEqual({
      '': {},
      ' ; charset=utf-8': {},
    })
  })
})
