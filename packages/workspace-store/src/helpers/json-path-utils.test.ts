import { describe, expect, test } from 'vitest'

import { parseJsonPointer } from '@/helpers/json-path-utils'

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
