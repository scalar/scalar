import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { type Nanoid, nanoidSchema } from './nanoid'

describe('nanoidSchema', () => {
  it('generates a string with minimum length of 7 characters when no value is provided', () => {
    const result = coerce(nanoidSchema, undefined)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThanOrEqual(7)
  })

  it('accepts valid strings with length >= 7', () => {
    const validString = '1234567'
    const result = coerce(nanoidSchema, validString)
    expect(result).toBe(validString)
  })

  it('generates a new id for strings shorter than 7 characters', () => {
    const invalidString = '123456'
    const result = coerce(nanoidSchema, invalidString)
    expect(result).not.toBe(invalidString)
    expect(result.length).toBeGreaterThanOrEqual(7)
  })

  it('generates different IDs for multiple calls', () => {
    const id1 = coerce(nanoidSchema, undefined)
    const id2 = coerce(nanoidSchema, undefined)
    expect(id1).not.toBe(id2)
  })

  it('types the generated ID as Nanoid', () => {
    const id: Nanoid = coerce(nanoidSchema, undefined)
    expect(typeof id).toBe('string')
  })
})
