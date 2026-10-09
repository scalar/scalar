import { describe, expect, expectTypeOf, it } from 'vitest'

import { mergeObjects } from '@/helpers/merge-object'

describe('mergeObjects', () => {
  it('merges prototype-named JSON properties as own data', () => {
    const source = JSON.parse('{"__proto__":{"debugPolluted":true},"constructor":{"prototype":{"debugPolluted":true}}}')
    const target = {}
    const before = Object.getOwnPropertyNames(Object.prototype)
    try {
      expect(mergeObjects(target, source)).toStrictEqual(source)
      expect(Object.getPrototypeOf(target)).toBe(Object.prototype)
      expect(Object.getOwnPropertyNames(Object.prototype)).toStrictEqual(before)
      mergeObjects(target, JSON.parse('{"__proto__":{"other":true}}'))
      expect(Object.getOwnPropertyDescriptor(target, '__proto__')?.value).toStrictEqual({
        debugPolluted: true,
        other: true,
      })
    } finally {
      Reflect.deleteProperty(Object.prototype, 'debugPolluted')
      Reflect.deleteProperty(Object.prototype, 'other')
    }
  })

  it('does not copy inherited source keys or merge into inherited target objects', () => {
    const inherited = { nested: { original: true } }
    const target = Object.create(inherited)
    const source = Object.assign(Object.create({ ignored: true }), { nested: { added: true } })
    mergeObjects(target, source)
    expect(Object.keys(target)).toStrictEqual(['nested'])
    expect(target.nested).toStrictEqual({ added: true })
    expect(inherited).toStrictEqual({ nested: { original: true } })
  })

  it('requires narrowing merged values before using them', () => {
    const result = mergeObjects({ value: 'text' }, { value: 42 })
    expectTypeOf(result).toEqualTypeOf<Record<string, unknown>>()
    expect(result.value).toBe(42)
  })

  it('should merge objects that does not have any conflicting keys', () => {
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

  it('should merge objects correctly even when they have the same key with the same value', () => {
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

  it('should deeply merge the objects', () => {
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

  it('should deeply merge the objects when there is same keys', () => {
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

  it('should deeply merge the objects and rewrite the same key with the new value', () => {
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
            d: 3,
          },
        },
      },
      b: 2,
    }

    expect(mergeObjects(a, b)).toEqual({
      a: {
        b: {
          c: {
            d: 3,
          },
        },
      },
      b: 2,
    })
  })

  it('should replace the first array with the second when replaceArray is true', () => {
    const a = {
      arr: [1, 2, 3],
    }

    const b = {
      arr: [],
    }

    expect(mergeObjects(a, b, true)).toEqual({
      arr: [],
    })
  })
})
