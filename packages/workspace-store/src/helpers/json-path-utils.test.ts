import { parseJsonPointer } from '@/helpers/json-path-utils'
import { describe, expect, test } from 'vitest'

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
