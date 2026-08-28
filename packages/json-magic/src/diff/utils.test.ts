import { afterEach, describe, expect, test } from 'vitest'

import { isArrayEqual, isKeyCollisions, mergeObjects } from '@/diff/utils'

describe('isKeyCollisions', () => {
  test.each([
    [
      {
        a: 1,
      },
      {
        a: {
          hello: 1,
        },
      },
    ],
    ['hello', 'hi'],
    [{ a: { b: { c: 1 } } }, { a: { b: { c: 2 } }, c: 1 }],
  ])('should return true', (a, b) => {
    expect(isKeyCollisions(a, b)).toBe(true)
  })

  test.each([
    [
      {
        a: {
          b: 1,
        },
      },
      {
        a: {
          c: 1,
        },
      },
    ],
    [{ a: { b: { c: 1 } } }, { a: { b: { d: 1 } }, c: 1 }],
  ])('should return false', (a, b) => {
    expect(isKeyCollisions(a, b)).toBe(false)
  })

  test.each([
    [[1, 2], { 0: 1, 1: 2 }],
    [{ 0: 1, 1: 2 }, [1, 2]],
    // The mismatch is nested rather than at the top level
    [{ servers: ['https://example.com'] }, { servers: { 0: 'https://example.com' } }],
    // Empty containers still carry a type
    [[], {}],
  ])('reports a collision when an array meets a plain object (case %#)', (a, b) => {
    expect(isKeyCollisions(a, b)).toBe(true)
  })

  test.each([
    [null, { a: 1 }],
    [[1, 2], null],
    [null, [1, 2]],
  ])('reports a collision when only one side is null (case %#)', (a, b) => {
    expect(isKeyCollisions(a, b)).toBe(true)
  })

  test('does not report a collision for two nulls', () => {
    expect(isKeyCollisions(null, null)).toBe(false)
  })

  test('does not report a collision for arrays that only differ in length', () => {
    // The shorter array has no value at the extra index, so there is nothing to disagree about and
    // the merge appends the new element
    expect(isKeyCollisions([1, 2], [1, 2, 3])).toBe(false)
  })

  test('reports a collision for arrays that disagree on an element', () => {
    expect(isKeyCollisions([1, 2], [1, 3, 4])).toBe(true)
  })

  test('does not report a collision for an own `__proto__` key', () => {
    // Only one side has `__proto__` as an own key, so the other side would resolve it to its own
    // prototype and look like a mismatch
    const a = JSON.parse('{"__proto__": 5, "openapi": "3.1.1"}')
    const b = { openapi: '3.1.1' }

    expect(isKeyCollisions(a, b)).toBe(false)
  })
})

describe('mergeObjects', () => {
  test('should merge objects that does not have any conflicting keys', () => {
    const a = {
      a: 'Hello',
    }

    const b = {
      b: 'Hello',
    }

    expect(mergeObjects(a, b)).toEqual({
      a: a.a,
      b: b.b,
    })
  })

  test('should merge objects correctly even when they have the same key with the same value', () => {
    const a = {
      a: 'Hello',
    }

    const b = {
      a: 'Hello',
    }

    expect(mergeObjects(a, b)).toEqual({
      a: a.a,
    })
  })

  test('should deeply merge the objects', () => {
    const a = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    }

    const b = {
      a: {
        b: {
          d: {
            e: 1,
          },
        },
      },
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 1,
          },
          d: {
            e: 1,
          },
        },
      },
    })
  })

  test('should deeply merge the objects when there is same keys', () => {
    const a = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
    }

    const b = {
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
      b: 1,
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 1,
          },
        },
      },
      b: 1,
    })
  })

  test('staples the keys of a plain object onto an array', () => {
    const a = [1, 2] as unknown as Record<string, unknown>
    const b: Record<string, unknown> = { 0: 1, 1: 2, url: 'https://example.com' }

    // `mergeObjects` trusts the caller to check for collisions first, so it has no container type
    // guard of its own. The result stays an array and picks up a key that no index can reach, which
    // is why `isKeyCollisions` has to reject the pair before this merge is ever attempted.
    const merged = mergeObjects(a, b)

    expect(Array.isArray(merged)).toBe(true)
    expect(merged).toHaveLength(2)
    expect(merged.url).toBe('https://example.com')
  })

  test('appends the elements an array is missing', () => {
    const a = [1, 2] as unknown as Record<string, unknown>
    const b = [1, 2, 3] as unknown as Record<string, unknown>

    expect(mergeObjects(a, b)).toEqual([1, 2, 3])
  })

  describe('prototype pollution', () => {
    // A regression writes the probe key onto `Object.prototype`, where it would leak into every
    // later test in the worker and turn one failure into many. Clean it up so failures stay readable.
    afterEach(() => {
      for (const key of ['pollutedByMerge', 'pollutedBesideSafeMerge']) {
        delete (Object.prototype as Record<string, unknown>)[key]
      }
    })

    test('does not merge a `__proto__` key into the prototype chain', () => {
      const a: Record<string, unknown> = { keep: 1 }
      // `JSON.parse` creates a real own `__proto__` property, unlike an object literal
      const b = JSON.parse('{"__proto__": {"pollutedByMerge": "yes"}}')

      expect(mergeObjects(a, b)).toEqual({ keep: 1 })
      expect(Object.getPrototypeOf(a)).toBe(Object.prototype)
      expect(({} as Record<string, unknown>).pollutedByMerge).toBeUndefined()
    })

    test('merges the safe keys of an object that also carries a `__proto__` key', () => {
      const a: Record<string, unknown> = { keep: 1 }
      const b = JSON.parse('{"__proto__": {"pollutedBesideSafeMerge": "yes"}, "added": 2}')

      expect(mergeObjects(a, b)).toEqual({ keep: 1, added: 2 })
      expect(({} as Record<string, unknown>).pollutedBesideSafeMerge).toBeUndefined()
    })
  })

  // The merge happens in place and the subtrees of the source are attached by reference, which is
  // how `merge` ends up writing into the documents its diffs were built from. The behavior is
  // pinned here so a future switch to cloning is a deliberate change rather than a silent one.
  describe('shares structure with both operands', () => {
    test('returns the target it was given', () => {
      const a: Record<string, unknown> = { keep: 1 }

      expect(mergeObjects(a, { added: 2 })).toBe(a)
      expect(a).toEqual({ keep: 1, added: 2 })
    })

    test('attaches the subtrees of the source by reference', () => {
      const a: Record<string, unknown> = {}
      const nested = { title: 'Pets' }

      mergeObjects(a, { info: nested })

      expect(a.info).toBe(nested)
    })

    test('merges into the subtree the target already holds instead of replacing it', () => {
      const a: Record<string, unknown> = { info: { title: 'Pets' } }
      const b = { info: { version: '1.0.0' } }

      mergeObjects(a, b)

      expect(a.info).toEqual({ title: 'Pets', version: '1.0.0' })
      expect(b.info).toEqual({ version: '1.0.0' })
    })
  })
})

describe('isArrayEqual', () => {
  test.each([
    [
      ['a', 'b', 'c'],
      ['a', 'b', 'c'],
    ],
    [
      [1, 2, 3],
      [1, 2, 3],
    ],
    // @ts-expect-error
  ])('should return true', (a, b) => expect(isArrayEqual(a, b)).toEqual(true))

  test.each([
    [
      ['a', 'b', 'c'],
      ['a', 'b'],
    ],
    [
      [1, 2, 4],
      [1, 2, 3],
    ],
    [
      [2, 2, 4],
      [1, 2, 3],
    ],
    // @ts-expect-error
  ])('should return false', (a, b) => expect(isArrayEqual(a, b)).toEqual(false))
})
