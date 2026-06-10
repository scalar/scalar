import { describe, expect, it } from 'vitest'

import { deserializeArrayParameter, isArraySchema, resolveSerialization } from './deserialize-parameter'

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
  })
})
