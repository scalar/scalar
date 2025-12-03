import { describe, expect, it } from 'vitest'

import { removeCircular } from './remove-circular'

describe('removeCircular', () => {
  describe('primitive values', () => {
    it('returns null as-is', () => {
      expect(removeCircular(null)).toBe(null)
    })

    it('returns undefined as-is', () => {
      expect(removeCircular(undefined)).toBe(undefined)
    })

    it('returns strings as-is', () => {
      expect(removeCircular('hello')).toBe('hello')
    })

    it('returns numbers as-is', () => {
      expect(removeCircular(42)).toBe(42)
    })

    it('returns booleans as-is', () => {
      expect(removeCircular(true)).toBe(true)
      expect(removeCircular(false)).toBe(false)
    })
  })

  describe('simple objects without circular references', () => {
    it('returns empty object', () => {
      expect(removeCircular({})).toEqual({})
    })

    it('returns simple object unchanged', () => {
      const obj = { name: 'test', value: 123 }
      expect(removeCircular(obj)).toEqual({ name: 'test', value: 123 })
    })

    it('returns nested object unchanged', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'NYC',
          },
        },
      }
      expect(removeCircular(obj)).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'NYC',
          },
        },
      })
    })

    it('does not mutate the original object', () => {
      const obj = { name: 'test', nested: { value: 1 } }
      const original = JSON.parse(JSON.stringify(obj))
      removeCircular(obj)
      expect(obj).toEqual(original)
    })
  })

  describe('arrays', () => {
    it('returns empty array', () => {
      expect(removeCircular([])).toEqual([])
    })

    it('returns array of primitives unchanged', () => {
      expect(removeCircular([1, 2, 3])).toEqual([1, 2, 3])
    })

    it('returns array of objects unchanged when no circular refs', () => {
      const arr = [{ id: 1 }, { id: 2 }]
      expect(removeCircular(arr)).toEqual([{ id: 1 }, { id: 2 }])
    })

    it('handles nested arrays', () => {
      const arr = [
        [1, 2],
        [3, 4],
      ]
      expect(removeCircular(arr)).toEqual([
        [1, 2],
        [3, 4],
      ])
    })
  })

  describe('circular references', () => {
    it('replaces self-referencing object with $ref', () => {
      const obj: Record<string, unknown> = { name: 'test' }
      obj.self = obj

      const result = removeCircular(obj)
      expect(result).toEqual({
        name: 'test',
        self: { $ref: '#' },
      })
    })

    it('replaces circular reference in nested object', () => {
      const parent: Record<string, unknown> = { name: 'parent' }
      const child: Record<string, unknown> = { name: 'child', parent }
      parent.child = child

      const result = removeCircular(parent)
      expect(result).toEqual({
        name: 'parent',
        child: {
          name: 'child',
          parent: { $ref: '#' },
        },
      })
    })

    it('replaces circular reference in array', () => {
      const obj: Record<string, unknown> = { items: [] }
      ;(obj.items as unknown[]).push(obj)

      const result = removeCircular(obj)
      expect(result).toEqual({
        items: [{ $ref: '#' }],
      })
    })

    it('handles multiple references to the same object', () => {
      const shared = { value: 42 }
      const obj = {
        first: shared,
        second: shared,
      }

      const result = removeCircular(obj)
      expect(result).toEqual({
        first: { value: 42 },
        second: { $ref: '#/first' },
      })
    })

    it('handles deeply nested circular reference', () => {
      const root: Record<string, unknown> = {
        level1: {
          level2: {
            level3: {},
          },
        },
      }
      ;((root.level1 as Record<string, unknown>).level2 as Record<string, unknown>).level3 = root

      const result = removeCircular(root)
      expect(result).toEqual({
        level1: {
          level2: {
            level3: { $ref: '#' },
          },
        },
      })
    })

    it('handles circular reference to intermediate node', () => {
      const root: Record<string, unknown> = {
        child: {
          grandchild: {},
        },
      }
      ;(root.child as Record<string, unknown>).grandchild = root.child

      const result = removeCircular(root)
      expect(result).toEqual({
        child: {
          grandchild: { $ref: '#/child' },
        },
      })
    })
  })

  describe('prefix option', () => {
    it('adds prefix to $ref path', () => {
      const obj: Record<string, unknown> = { name: 'test' }
      obj.self = obj

      const result = removeCircular(obj, { prefix: '/components/schemas' })
      expect(result).toEqual({
        name: 'test',
        self: { $ref: '#/components/schemas' },
      })
    })

    it('adds prefix to nested $ref path', () => {
      const shared = { value: 1 }
      const obj = {
        a: shared,
        b: shared,
      }

      const result = removeCircular(obj, { prefix: '/definitions' })
      expect(result).toEqual({
        a: { value: 1 },
        b: { $ref: '#/definitions/a' },
      })
    })
  })

  describe('edge cases', () => {
    it('handles object with null property', () => {
      const obj = { value: null }
      expect(removeCircular(obj)).toEqual({ value: null })
    })

    it('handles object with undefined property', () => {
      const obj = { value: undefined }
      expect(removeCircular(obj)).toEqual({ value: undefined })
    })

    it('handles mixed arrays and objects', () => {
      const obj = {
        items: [{ nested: { deep: true } }],
      }
      expect(removeCircular(obj)).toEqual({
        items: [{ nested: { deep: true } }],
      })
    })

    it('handles self-referencing array', () => {
      const arr: unknown[] = [1, 2]
      arr.push(arr)

      const result = removeCircular(arr)
      expect(result).toEqual([1, 2, { $ref: '#' }])
    })

    it('handles complex graph with multiple circular paths', () => {
      const a: Record<string, unknown> = { name: 'a' }
      const b: Record<string, unknown> = { name: 'b' }
      const c: Record<string, unknown> = { name: 'c' }

      a.b = b
      b.c = c
      c.a = a
      c.b = b

      const result = removeCircular(a)
      expect(result).toEqual({
        name: 'a',
        b: {
          name: 'b',
          c: {
            name: 'c',
            a: { $ref: '#' },
            b: { $ref: '#/b' },
          },
        },
      })
    })
  })
})
