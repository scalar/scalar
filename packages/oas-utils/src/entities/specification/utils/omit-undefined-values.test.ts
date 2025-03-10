import { describe, expect, it } from 'vitest'
import { omitUndefinedValues } from './omit-undefined-values'

describe('omitUndefinedValues', () => {
  it('should remove undefined values from an object', () => {
    const obj = { a: 1, b: undefined, c: 3 }
    const result = omitUndefinedValues(obj)
    expect(result).toEqual({ a: 1, c: 3 })
  })
})
