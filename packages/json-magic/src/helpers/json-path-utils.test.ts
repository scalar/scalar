import { describe, expect, test } from 'vitest'

import { createPathFromSegments, parseJsonPointer } from './json-path-utils'

describe('parseJsonPointer', () => {
  test.each([
    ['#/users/name', ['users', 'name']],
    ['#/', []],
    ['', []],
    ['users/name', ['users', 'name']],
  ])('should correctly parse json pointers', (a, b) => {
    expect(parseJsonPointer(a)).toEqual(b)
  })
})

describe('createPathFromSegments', () => {
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
