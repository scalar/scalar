import { describe, expect, it } from 'vitest'

import { setValueAtPath } from '@/helpers/set-value-at-path'

describe('setValueAtPath', () => {
  describe('basic object creation', () => {
    it('creates nested objects for a simple path', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b/c', 'value')

      expect(obj).toEqual({ a: { b: { c: 'value' } } })
    })

    it('creates nested objects with object values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b/c', { hello: 'hi' })

      expect(obj).toEqual({ a: { b: { c: { hello: 'hi' } } } })
    })

    it('adds new properties to existing objects', () => {
      const obj = { a: { b: 'b' } }
      setValueAtPath(obj, '/a/c', { hello: 'hi' })

      expect(obj).toEqual({ a: { b: 'b', c: { hello: 'hi' } } })
    })

    it('creates a single level property', () => {
      const obj = {}
      setValueAtPath(obj, '/foo', 'bar')

      expect(obj).toEqual({ foo: 'bar' })
    })
  })

  describe('array creation', () => {
    it('creates an array when the next segment is numeric', () => {
      const obj = {}
      setValueAtPath(obj, '/foo/0', 'value')

      expect(obj).toEqual({ foo: ['value'] })
    })

    it('creates nested arrays', () => {
      const obj = {}
      setValueAtPath(obj, '/foo/0/0', 'value')

      expect(obj).toEqual({ foo: [['value']] })
    })

    it('creates an array with sparse indices', () => {
      const obj = {}
      setValueAtPath(obj, '/foo/3', 'value')

      expect(obj).toEqual({ foo: [undefined, undefined, undefined, 'value'] })
    })

    it('creates mixed object and array structures', () => {
      const obj = {}
      setValueAtPath(obj, '/foo/bar/0/baz', 'value')

      expect(obj).toEqual({ foo: { bar: [{ baz: 'value' }] } })
    })

    it('handles numeric-looking keys by creating arrays', () => {
      const obj = {}
      setValueAtPath(obj, '/foo/123/bar', 'value')

      expect(obj).toEqual({
        foo: Array.from({ length: 124 }, (_, i) => (i === 123 ? { bar: 'value' } : undefined)),
      })
    })
  })

  describe('overwriting values', () => {
    it('overwrites existing primitive values', () => {
      const obj = { a: { b: { c: 'old' } } }
      setValueAtPath(obj, '/a/b/c', 'new')

      expect(obj).toEqual({ a: { b: { c: 'new' } } })
    })

    it('overwrites existing object values', () => {
      const obj = { a: { b: { old: 'value' } } }
      setValueAtPath(obj, '/a/b', { new: 'value' })

      expect(obj).toEqual({ a: { b: { new: 'value' } } })
    })

    it('replaces non-object values with objects', () => {
      const obj = { a: { b: 'string' } }
      setValueAtPath(obj, '/a/b/c', 'value')

      expect(obj).toEqual({ a: { b: { c: 'value' } } })
    })

    it('replaces non-array values with arrays', () => {
      const obj = { a: { b: 'string' } }
      setValueAtPath(obj, '/a/b/0', 'value')

      expect(obj).toEqual({ a: { b: ['value'] } })
    })
  })

  describe('value types', () => {
    it('sets null values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b', null)

      expect(obj).toEqual({ a: { b: null } })
    })

    it('sets undefined values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b', undefined)

      expect(obj).toEqual({ a: { b: undefined } })
    })

    it('sets array values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b', [1, 2, 3])

      expect(obj).toEqual({ a: { b: [1, 2, 3] } })
    })

    it('sets boolean values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b', true)

      expect(obj).toEqual({ a: { b: true } })
    })

    it('sets number values', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b', 42)

      expect(obj).toEqual({ a: { b: 42 } })
    })
  })

  describe('edge cases', () => {
    it('throws an error when setting value at root path', () => {
      const obj = {}

      expect(() => setValueAtPath(obj, '', 'value')).toThrow("Cannot set value at root ('') pointer")
    })

    it('handles deeply nested paths', () => {
      const obj = {}
      setValueAtPath(obj, '/a/b/c/d/e/f/g/h', 'deep')

      expect(obj).toEqual({
        a: { b: { c: { d: { e: { f: { g: { h: 'deep' } } } } } } },
      })
    })

    it('handles special characters in keys', () => {
      const obj = {}
      setValueAtPath(obj, '/foo-bar/baz_qux', 'value')

      expect(obj).toEqual({ 'foo-bar': { baz_qux: 'value' } })
    })

    it('works with existing arrays', () => {
      const obj = { arr: ['a', 'b', 'c'] }
      setValueAtPath(obj, '/arr/1', 'modified')

      expect(obj).toEqual({ arr: ['a', 'modified', 'c'] })
    })

    it('adds to existing arrays', () => {
      const obj = { arr: ['a', 'b'] }
      setValueAtPath(obj, '/arr/2', 'new')

      expect(obj).toEqual({ arr: ['a', 'b', 'new'] })
    })

    it('handles zero as an array index', () => {
      const obj = {}
      setValueAtPath(obj, '/items/0/name', 'first')

      expect(obj).toEqual({ items: [{ name: 'first' }] })
    })

    it('mutates the original object', () => {
      const obj = { existing: 'value' }
      const reference = obj

      setValueAtPath(obj, '/new/path', 'test')

      expect(reference).toBe(obj)
      expect(reference).toEqual({ existing: 'value', new: { path: 'test' } })
    })
  })
})
