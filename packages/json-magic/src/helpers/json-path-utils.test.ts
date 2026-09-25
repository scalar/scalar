import { describe, expect, it, test } from 'vitest'

import { createPathFromSegments } from './json-path-utils'

describe('createPathFromSegments', () => {
  it('notifies proxy set traps when creating ordinary path segments', () => {
    const writes: string[] = []
    const target = new Proxy<Record<string, unknown>>(
      {},
      {
        set(object, key, value): boolean {
          writes.push(String(key))
          return Reflect.set(object, key, value)
        },
      },
    )

    createPathFromSegments(target, ['components', 'schemas'])

    expect(writes).toStrictEqual(['components'])
    expect(target).toStrictEqual({ components: { schemas: {} } })
  })

  it.each(['debugPolluted', '123'])('creates own prototype-named paths ending in %s', (key) => {
    const target = {}
    const before = Object.getOwnPropertyNames(Object.prototype)
    try {
      const leaf = createPathFromSegments(target, ['__proto__', key])
      expect(Object.getPrototypeOf(target)).toBe(Object.prototype)
      expect(Object.hasOwn(target, '__proto__')).toBe(true)
      expect(Object.getOwnPropertyNames(Object.prototype)).toStrictEqual(before)
      expect(leaf).toStrictEqual(key === '123' ? [] : {})
    } finally {
      Reflect.deleteProperty(Object.prototype, key)
    }
  })

  it('creates an own constructor path instead of traversing Object', () => {
    const target = {}
    const leaf = createPathFromSegments(target, ['constructor', 'prototype', 'debugPolluted'])
    expect(JSON.stringify(target)).toBe('{"constructor":{"prototype":{"debugPolluted":{}}}}')
    expect(leaf).toStrictEqual({})
    expect(Object.hasOwn(Object.prototype, 'debugPolluted')).toBe(false)
  })

  test('creates nested objects for non-numeric segments', () => {
    const obj: any = {}
    const leaf = createPathFromSegments(obj, ['components', 'schemas', 'User'])

    expect(obj).toEqual({ components: { schemas: { User: {} } } })
    expect(leaf).toBe(obj.components.schemas.User)
  })

  test('creates arrays for numeric segments', () => {
    const obj: any = {}
    const arr = createPathFromSegments(obj, ['items', '0'])

    expect(Array.isArray(obj.items['0'])).toBe(true)
    expect(arr).toBe(obj.items['0'])
  })

  test('does not overwrite existing values along the path', () => {
    const obj: any = { a: { b: { c: { existing: true } } } }
    const leaf = createPathFromSegments(obj, ['a', 'b', 'c'])

    expect(leaf).toEqual({ existing: true })
    expect(obj.a.b.c).toEqual({ existing: true })
  })

  test('returns root object when segments array is empty', () => {
    const obj: any = { pre: true }
    const result = createPathFromSegments(obj, [])

    expect(result).toBe(obj)
    expect(obj).toEqual({ pre: true })
  })

  test('creates nested arrays for consecutive numeric segments', () => {
    const obj: any = {}
    const leaf = createPathFromSegments(obj, ['arr', '0', '1'])

    expect(Array.isArray(obj.arr['0'])).toBe(true)
    expect(Array.isArray(obj.arr['0']['1'])).toBe(true)
    expect(leaf).toBe(obj.arr['0']['1'])
  })
})
