import { describe, expect, it } from 'vitest'

import { formatTokenPrefix } from './format-token-prefix'

describe('format-token-prefix', () => {
  it.each([
    ['abc', 'token', 'token abc'],
    [' abc ', 'token', 'token abc'],
    ['   ', 'token', ''],
    [' abc ', undefined, ' abc '],
    ['abc', ' token ', 'token abc'],
    ['abc', '', 'abc'],
    ['abc', undefined, 'abc'],
    ['', 'token', ''],
    ['token abc', 'token', 'token token abc'],
  ])('formats %j with prefix %j', (value, prefix, expected) => {
    expect(formatTokenPrefix(value, prefix)).toBe(expected)
  })
})
