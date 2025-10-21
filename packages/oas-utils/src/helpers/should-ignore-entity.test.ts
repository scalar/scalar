import { describe, expect, it } from 'vitest'

import { shouldIgnoreEntity } from './should-ignore-entity'

describe('shouldIgnoreEntity', () => {
  it('returns false when neither flag is set', () => {
    const result = shouldIgnoreEntity({})
    expect(result).toBe(false)
  })

  it('returns true when x-internal is true', () => {
    const result = shouldIgnoreEntity({ 'x-internal': true })
    expect(result).toBe(true)
  })

  it('returns true when x-scalar-ignore is true', () => {
    const result = shouldIgnoreEntity({ 'x-scalar-ignore': true })
    expect(result).toBe(true)
  })

  it('returns true when both flags are true', () => {
    const result = shouldIgnoreEntity({ 'x-internal': true, 'x-scalar-ignore': true })
    expect(result).toBe(true)
  })
})
