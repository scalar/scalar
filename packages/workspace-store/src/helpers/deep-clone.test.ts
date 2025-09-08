import { describe, expect, it } from 'vitest'

import { deepClone } from '@/helpers/deep-clone'

describe('deepClone', () => {
  it('should return primitives as-is', () => {
    expect(deepClone(42)).toBe(42)
    expect(deepClone('string')).toBe('string')
    expect(deepClone(true)).toBe(true)
    expect(deepClone(false)).toBe(false)
    expect(deepClone(null)).toBe(null)
    expect(deepClone(undefined)).toBe(undefined)
  })

  it('should clone simple objects', () => {
    const original = { a: 1, b: 'hello', c: true }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.a).toBe(1)
    expect(cloned.b).toBe('hello')
    expect(cloned.c).toBe(true)
  })

  it('should clone simple arrays', () => {
    const original = [1, 'hello', true, null]
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(Array.isArray(cloned)).toBe(true)
  })

  it('should clone nested objects', () => {
    const original = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.b).not.toBe(original.b)
    expect(cloned.b.d).not.toBe(original.b.d)
    expect(cloned.b.d.e).toBe(3)
  })

  it('should clone nested arrays', () => {
    const original = [1, [2, [3, 4]], 5] as const
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned[1]).not.toBe(original[1])
    expect(cloned[1][1]).not.toBe(original[1][1])
  })

  it('should clone mixed nested structures', () => {
    const original = {
      array: [1, { nested: 'value' }, [2, 3]],
      object: {
        arr: ['a', 'b'],
        nested: {
          deep: 'value',
        },
      },
    }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned.array).not.toBe(original.array)
    expect(cloned.array[1]).not.toBe(original.array[1])
    expect(cloned.array[2]).not.toBe(original.array[2])
    expect(cloned.object).not.toBe(original.object)
    expect(cloned.object.arr).not.toBe(original.object.arr)
    expect(cloned.object.nested).not.toBe(original.object.nested)
  })

  it('should handle circular references', () => {
    const original: any = { a: 1 }
    original.self = original

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned.a).toBe(1)
    expect(cloned.self).toBe(cloned)
    expect(cloned.self).not.toBe(original)
  })

  it('should handle complex circular references', () => {
    const original: any = {
      a: 1,
      b: {
        c: 2,
      },
    }
    original.b.parent = original
    original.selfRef = original.b

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned.b).not.toBe(original.b)
    expect(cloned.b.parent).toBe(cloned)
    expect(cloned.selfRef).toBe(cloned.b)
    expect(cloned.selfRef.parent).toBe(cloned)
  })

  it('should handle circular references in arrays', () => {
    const original: any = [1, 2]
    original.push(original)

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned[0]).toBe(1)
    expect(cloned[1]).toBe(2)
    expect(cloned[2]).toBe(cloned)
  })

  it('should handle empty objects and arrays', () => {
    const emptyObj = deepClone({})
    const emptyArr = deepClone([])

    expect(emptyObj).toEqual({})
    expect(emptyArr).toEqual([])
    expect(Array.isArray(emptyArr)).toBe(true)
  })

  it('should preserve object key order', () => {
    const original = { c: 3, a: 1, b: 2 }
    const cloned = deepClone(original)

    expect(Object.keys(cloned)).toEqual(['c', 'a', 'b'])
  })

  it('should handle objects with numeric string keys', () => {
    const original = { '0': 'zero', '1': 'one', 'normal': 'key' }
    const cloned = deepClone(original)

    expect(cloned).toEqual(original)
    expect(cloned).not.toBe(original)
    expect(cloned['0']).toBe('zero')
    expect(cloned['1']).toBe('one')
    expect(cloned.normal).toBe('key')
  })

  it('should handle deeply nested circular references', () => {
    const original: any = {
      level1: {
        level2: {
          level3: {
            data: 'deep',
          },
        },
      },
    }
    original.level1.level2.level3.backToRoot = original
    original.level1.level2.backToLevel1 = original.level1

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned.level1.level2.level3.backToRoot).toBe(cloned)
    expect(cloned.level1.level2.backToLevel1).toBe(cloned.level1)
    expect(cloned.level1.level2.level3.data).toBe('deep')
  })

  it('should handle multiple references to the same object', () => {
    const shared = { shared: 'data' }
    const original = {
      ref1: shared,
      ref2: shared,
      nested: {
        ref3: shared,
      },
    }

    const cloned = deepClone(original)

    expect(cloned).not.toBe(original)
    expect(cloned.ref1).toBe(cloned.ref2)
    expect(cloned.ref1).toBe(cloned.nested.ref3)
    expect(cloned.ref1).not.toBe(shared)
    expect(cloned.ref1.shared).toBe('data')
  })

  it('should maintain referential equality for identical objects in clone', () => {
    const original: any = {}
    const shared = { value: 42 }

    original.a = shared
    original.b = shared
    original.nested = { c: shared }

    const cloned = deepClone(original)

    // All references to the shared object should point to the same cloned instance
    expect(cloned.a).toBe(cloned.b)
    expect(cloned.a).toBe(cloned.nested.c)
    expect(cloned.a).not.toBe(shared)
    expect(cloned.a.value).toBe(42)
  })
})
