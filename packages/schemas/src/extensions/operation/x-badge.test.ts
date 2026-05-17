import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XBadge, XBadges } from './x-badge'

describe('x-badge', () => {
  it('validates minimal badge with only required name', () => {
    expect(validate(XBadge, { name: 'Deprecated' })).toBe(true)
    expect(coerce(XBadge, { name: 'Deprecated' })).toEqual({
      name: 'Deprecated',
    })
  })

  it('rejects badge without required name field', () => {
    expect(validate(XBadge, { position: 'after', color: 'red' })).toBe(false)
  })

  it('validates badge with all optional properties', () => {
    const value = {
      name: 'Beta',
      position: 'before' as const,
      color: '#ff6b6b',
    }
    expect(validate(XBadge, value)).toBe(true)
    expect(coerce(XBadge, value)).toEqual(value)
  })

  it('validates array with single badge', () => {
    const value = { 'x-badges': [{ name: 'Deprecated' }] }
    expect(validate(XBadges, value)).toBe(true)
    expect(coerce(XBadges, value)).toEqual({
      'x-badges': [{ name: 'Deprecated' }],
    })
  })

  it('allows empty object', () => {
    expect(validate(XBadges, {})).toBe(true)
    expect(coerce(XBadges, {})).toEqual({})
  })
})
