import { describe, expect, it } from 'vitest'

import { isObject } from './is-object'

describe('isObject', () => {
  it('returns true for an object', () => {
    const result = isObject({
      foo: 'bar',
    })
    expect(result).toBe(true)
  })

  it('returns true for an empty object', () => {
    const result = isObject({})
    expect(result).toBe(true)
  })

  it('returns false for a string', () => {
    const result = isObject('foo')
    expect(result).toBe(false)
  })

  it('returns false for an array', () => {
    const result = isObject([])
    expect(result).toBe(false)
  })
})
