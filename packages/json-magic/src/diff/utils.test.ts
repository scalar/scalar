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
