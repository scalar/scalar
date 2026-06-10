import { describe, expect, it } from 'vitest'

import {
  deserializeArrayParameter,
  deserializeObjectParameter,
  isArraySchema,
  isObjectSchema,
  resolveSerialization,
} from './deserialize-parameter'

describe('deserialize-parameter', () => {
  describe('resolveSerialization', () => {
    it('applies the default style per location', () => {
      expect(resolveSerialization('query')).toEqual({ style: 'form', explode: true })
      expect(resolveSerialization('cookie')).toEqual({ style: 'form', explode: true })
      expect(resolveSerialization('path')).toEqual({ style: 'simple', explode: false })
      expect(resolveSerialization('header')).toEqual({ style: 'simple', explode: false })
    })

    it('defaults explode to true only for the form style', () => {
      expect(resolveSerialization('query', 'pipeDelimited')).toEqual({ style: 'pipeDelimited', explode: false })
      expect(resolveSerialization('query', 'spaceDelimited')).toEqual({ style: 'spaceDelimited', explode: false })
    })

    it('respects an explicit explode flag', () => {
      expect(resolveSerialization('query', 'form', false)).toEqual({ style: 'form', explode: false })
      expect(resolveSerialization('path', 'simple', true)).toEqual({ style: 'simple', explode: true })
    })
  })

  describe('isArraySchema', () => {
    it('detects array schemas', () => {
      expect(isArraySchema({ type: 'array', items: { type: 'string' } })).toBe(true)
      expect(isArraySchema({ type: ['array', 'null'] })).toBe(true)
      expect(isArraySchema({ items: { type: 'string' } })).toBe(true)
    })

    it('returns false for non-array schemas', () => {
      expect(isArraySchema({ type: 'string' })).toBe(false)
      expect(isArraySchema({ type: 'object' })).toBe(false)
      expect(isArraySchema(undefined)).toBe(false)
    })
  })

  describe('deserializeArrayParameter', () => {
    it('returns undefined when the parameter is absent', () => {
      expect(deserializeArrayParameter({ style: 'form', explode: true, single: undefined })).toBeUndefined()
      expect(deserializeArrayParameter({ style: 'simple', explode: false, single: undefined })).toBeUndefined()
    })

    it('reads exploded form arrays from repeated values', () => {
      expect(deserializeArrayParameter({ style: 'form', explode: true, single: '1', multi: ['1', '2', '3'] })).toEqual([
        '1',
        '2',
        '3',
      ])
    })

    it('splits non-exploded form arrays on commas', () => {
      expect(deserializeArrayParameter({ style: 'form', explode: false, single: '1,2,3' })).toEqual(['1', '2', '3'])
    })

    it('splits spaceDelimited and pipeDelimited arrays', () => {
      expect(deserializeArrayParameter({ style: 'spaceDelimited', explode: false, single: '1 2 3' })).toEqual([
        '1',
        '2',
        '3',
      ])
      expect(deserializeArrayParameter({ style: 'pipeDelimited', explode: false, single: '1|2|3' })).toEqual([
        '1',
        '2',
        '3',
      ])
    })

    it('splits simple-style arrays on commas regardless of explode', () => {
      expect(deserializeArrayParameter({ style: 'simple', explode: false, single: '1,2,3' })).toEqual(['1', '2', '3'])
      expect(deserializeArrayParameter({ style: 'simple', explode: true, single: '1,2,3' })).toEqual(['1', '2', '3'])
    })

    it('parses label arrays (dot-prefixed, dot-separated)', () => {
      expect(deserializeArrayParameter({ style: 'label', explode: false, single: '.1.2.3' })).toEqual(['1', '2', '3'])
      expect(deserializeArrayParameter({ style: 'label', explode: true, single: '.1.2.3' })).toEqual(['1', '2', '3'])
    })

    it('parses matrix arrays for both explode modes', () => {
      expect(deserializeArrayParameter({ style: 'matrix', explode: false, single: ';ids=1,2,3' })).toEqual([
        '1',
        '2',
        '3',
      ])
      expect(deserializeArrayParameter({ style: 'matrix', explode: true, single: ';ids=1;ids=2;ids=3' })).toEqual([
        '1',
        '2',
        '3',
      ])
    })
  })

  describe('isObjectSchema', () => {
    it('detects object schemas', () => {
      expect(isObjectSchema({ type: 'object', properties: {} })).toBe(true)
      expect(isObjectSchema({ type: ['object', 'null'] })).toBe(true)
      expect(isObjectSchema({ properties: { a: { type: 'string' } } })).toBe(true)
    })

    it('returns false for non-object schemas', () => {
      expect(isObjectSchema({ type: 'array', items: {} })).toBe(false)
      expect(isObjectSchema({ type: 'string' })).toBe(false)
      expect(isObjectSchema(undefined)).toBe(false)
    })
  })

  describe('deserializeObjectParameter', () => {
    it('returns undefined when the parameter is absent', () => {
      expect(
        deserializeObjectParameter({ style: 'form', explode: false, single: undefined, name: 'color' }),
      ).toBeUndefined()
      expect(
        deserializeObjectParameter({ style: 'deepObject', explode: true, single: undefined, name: 'color', query: {} }),
      ).toBeUndefined()
    })

    it('parses deepObject bracket notation from the query map', () => {
      expect(
        deserializeObjectParameter({
          style: 'deepObject',
          explode: true,
          single: undefined,
          name: 'color',
          query: { 'color[R]': '100', 'color[G]': '200', other: 'x' },
        }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('gathers exploded form objects from matching top-level query keys', () => {
      expect(
        deserializeObjectParameter({
          style: 'form',
          explode: true,
          single: undefined,
          name: 'color',
          query: { R: '100', G: '200', unrelated: 'x' },
          propertyNames: ['R', 'G', 'B'],
        }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('parses non-exploded form/simple objects as alternating key,value', () => {
      expect(
        deserializeObjectParameter({ style: 'form', explode: false, single: 'R,100,G,200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
      expect(
        deserializeObjectParameter({ style: 'simple', explode: false, single: 'R,100,G,200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('parses exploded simple objects as key=value pairs', () => {
      expect(
        deserializeObjectParameter({ style: 'simple', explode: true, single: 'R=100,G=200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('parses label objects (dot-prefixed) for both explode modes', () => {
      expect(
        deserializeObjectParameter({ style: 'label', explode: false, single: '.R.100.G.200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
      expect(
        deserializeObjectParameter({ style: 'label', explode: true, single: '.R=100.G=200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('parses matrix objects for both explode modes', () => {
      expect(
        deserializeObjectParameter({ style: 'matrix', explode: true, single: ';R=100;G=200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
      expect(
        deserializeObjectParameter({ style: 'matrix', explode: false, single: ';color=R,100,G,200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
    })
  })
})
