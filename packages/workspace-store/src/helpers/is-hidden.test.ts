import { describe, expect, it } from 'vitest'

import { isHidden } from './is-hidden'

describe('isHidden', () => {
  it('returns false for undefined', () => {
    expect(isHidden(undefined)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isHidden(null)).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isHidden({})).toBe(false)
  })

  it('returns true when x-internal is true', () => {
    expect(isHidden({ 'x-internal': true })).toBe(true)
  })

  it('returns true when x-scalar-ignore is true', () => {
    expect(isHidden({ 'x-scalar-ignore': true })).toBe(true)
  })

  it('returns true when both flags are true', () => {
    expect(isHidden({ 'x-internal': true, 'x-scalar-ignore': true })).toBe(true)
  })

  it('returns false when both flags are explicitly false', () => {
    expect(isHidden({ 'x-internal': false, 'x-scalar-ignore': false })).toBe(false)
  })
})
