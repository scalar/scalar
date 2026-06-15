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

    it('detects array schemas wrapped in anyOf/oneOf/allOf composition', () => {
      // FastAPI/Pydantic `Optional[List[str]]` is emitted as `anyOf: [{ type: 'array' }, { type: 'null' }]`.
      expect(isArraySchema({ anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] })).toBe(true)
      expect(isArraySchema({ oneOf: [{ type: 'array', items: {} }] })).toBe(true)
      expect(isArraySchema({ allOf: [{ items: { type: 'string' } }] })).toBe(true)
      expect(isArraySchema({ anyOf: [{ type: 'string' }, { type: 'null' }] })).toBe(false)
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

    it('trims optional whitespace after commas in simple-style (header) arrays', () => {
      // HTTP allows OWS after the comma in header list values, e.g. `X-Tags: a, b, c`.
      expect(deserializeArrayParameter({ style: 'simple', explode: false, single: 'a, b, c' })).toEqual(['a', 'b', 'c'])
    })

    it('parses label arrays (comma-separated when not exploded, dot-separated when exploded)', () => {
      // Per the spec Style Examples: non-exploded `label` is `.blue,black,brown`, exploded is `.blue.black.brown`.
      expect(deserializeArrayParameter({ style: 'label', explode: false, single: '.1,2,3' })).toEqual(['1', '2', '3'])
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

    it('deserializes an empty value as an empty array rather than a phantom element', () => {
      // `?ids=` is zero elements, not `['']`; otherwise it would satisfy `minItems: 1` while the empty
      // string fails the element type check.
      expect(deserializeArrayParameter({ style: 'form', explode: false, single: '' })).toEqual([])
      expect(deserializeArrayParameter({ style: 'simple', explode: false, single: '' })).toEqual([])
      expect(deserializeArrayParameter({ style: 'spaceDelimited', explode: false, single: '' })).toEqual([])
      expect(deserializeArrayParameter({ style: 'label', explode: false, single: '.' })).toEqual([])
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

    it('detects object schemas wrapped in anyOf/oneOf/allOf composition', () => {
      expect(isObjectSchema({ anyOf: [{ type: 'object', properties: { r: {} } }, { type: 'null' }] })).toBe(true)
      expect(isObjectSchema({ allOf: [{ type: 'object' }] })).toBe(true)
      expect(isObjectSchema({ oneOf: [{ properties: { r: {} } }] })).toBe(true)
      expect(isObjectSchema({ anyOf: [{ type: 'string' }] })).toBe(false)
    })
  })

  describe('deserializeObjectParameter', () => {
    it('returns undefined when the parameter is absent', () => {
      expect(
        deserializeObjectParameter({ style: 'form', explode: false, single: undefined, name: 'color' }),
      ).toBeUndefined()
      expect(
        deserializeObjectParameter({ style: 'deepObject', explode: true, single: undefined, name: 'color', map: {} }),
      ).toBeUndefined()
    })

    it('parses deepObject bracket notation from the query map', () => {
      expect(
        deserializeObjectParameter({
          style: 'deepObject',
          explode: true,
          single: undefined,
          name: 'color',
          map: { 'color[R]': '100', 'color[G]': '200', other: 'x' },
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
          map: { R: '100', G: '200', unrelated: 'x' },
          propertyNames: ['R', 'G', 'B'],
        }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('gathers a free-form exploded object (no declared properties) from every key in the map', () => {
      // A `type: object` parameter with no declared `properties` claims every key in the location;
      // otherwise a present value would be wrongly treated as a missing required parameter.
      expect(
        deserializeObjectParameter({
          style: 'form',
          explode: true,
          single: undefined,
          name: 'meta',
          map: { x: '1', y: '2' },
          propertyNames: [],
        }),
      ).toEqual({ x: '1', y: '2' })
      // Truly absent stays undefined so `required` enforcement still works.
      expect(
        deserializeObjectParameter({
          style: 'form',
          explode: true,
          single: undefined,
          name: 'meta',
          map: {},
          propertyNames: [],
        }),
      ).toBeUndefined()
    })

    it('keeps array-valued properties when a deepObject or form key repeats', () => {
      expect(
        deserializeObjectParameter({
          style: 'deepObject',
          explode: true,
          single: undefined,
          name: 'filter',
          map: { 'filter[tags]': ['a', 'b'] },
          propertyNames: ['tags'],
        }),
      ).toEqual({ tags: ['a', 'b'] })
      expect(
        deserializeObjectParameter({
          style: 'form',
          explode: true,
          single: undefined,
          name: 'color',
          map: { tags: ['a', 'b'], r: '1' },
          propertyNames: ['tags', 'r'],
        }),
      ).toEqual({ tags: ['a', 'b'], r: '1' })
    })

    it('ignores deepObject keys with nested brackets instead of emitting a corrupt property', () => {
      // `deepObject` defines only a single level of nesting, so `filter[a][b]` must not become `a][b`.
      expect(
        deserializeObjectParameter({
          style: 'deepObject',
          explode: true,
          single: undefined,
          name: 'filter',
          map: { 'filter[a][b]': '1', 'filter[min]': '5' },
          propertyNames: ['min'],
        }),
      ).toEqual({ min: '5' })
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

    it('parses label objects (comma-separated when not exploded, dot key=value when exploded)', () => {
      // Per the spec Style Examples: non-exploded `label` object is `.R,100,G,200`, exploded is `.R=100.G=200`.
      expect(
        deserializeObjectParameter({ style: 'label', explode: false, single: '.R,100,G,200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
      expect(
        deserializeObjectParameter({ style: 'label', explode: true, single: '.R=100.G=200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
    })

    it('parses spaceDelimited and pipeDelimited objects as delimiter-separated key,value lists', () => {
      // Per the spec Style Examples: `color=R%20100%20G%20200` (space) / `color=R%7C100%7CG%7C200` (pipe).
      expect(
        deserializeObjectParameter({ style: 'spaceDelimited', explode: false, single: 'R 100 G 200', name: 'color' }),
      ).toEqual({ R: '100', G: '200' })
      expect(
        deserializeObjectParameter({ style: 'pipeDelimited', explode: false, single: 'R|100|G|200', name: 'color' }),
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
