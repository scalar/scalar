import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { BadgeSchema, XBadgesSchema } from './x-badge'

describe('x-badge', () => {
  it('validates minimal badge with only required name', () => {
    const result = Value.Parse(BadgeSchema, { name: 'Deprecated' })
    expect(result).toEqual({
      name: 'Deprecated',
      position: 'after',
    })
  })

  it('throws when badge without required name field', () => {
    expect(() => Value.Parse(BadgeSchema, { position: 'after', color: 'red' })).toThrow()
  })

  it('validates badge with all optional properties', () => {
    const result = Value.Parse(BadgeSchema, {
      name: 'Beta',
      position: 'before',
      color: '#ff6b6b',
    })
    expect(result).toEqual({
      name: 'Beta',
      position: 'before',
      color: '#ff6b6b',
    })
  })

  it('validates array with single badge', () => {
    const result = Value.Parse(XBadgesSchema, {
      'x-badges': [{ name: 'Deprecated' }],
    })
    expect(result).toEqual({
      'x-badges': [{ name: 'Deprecated', position: 'after' }],
    })
  })

  it('defaults to undefined when empty object', () => {
    const result = Value.Parse(XBadgesSchema, {})
    expect(result).toEqual({
      'x-badges': undefined,
    })
  })
})
