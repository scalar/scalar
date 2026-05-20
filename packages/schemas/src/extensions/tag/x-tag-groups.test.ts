import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XTagGroups } from './x-tag-groups'

describe('XTagGroups', () => {
  it('accepts valid tag groups array', () => {
    const value = {
      'x-tagGroups': [
        {
          name: 'Core',
          tags: ['users', 'auth'],
        },
        {
          name: 'Products',
          tags: ['inventory', 'orders'],
        },
      ],
    }
    expect(validate(XTagGroups, value)).toBe(true)
    expect(coerce(XTagGroups, value)).toEqual(value)
  })

  it('accepts empty array', () => {
    const value = { 'x-tagGroups': [] }
    expect(validate(XTagGroups, value)).toBe(true)
    expect(coerce(XTagGroups, value)).toEqual(value)
  })

  it('rejects groups without name', () => {
    expect(
      validate(XTagGroups, {
        'x-tagGroups': [
          {
            tags: ['users'],
          },
        ],
      }),
    ).toBe(false)
  })

  it('coerces invalid tag values to empty strings', () => {
    expect(
      coerce(XTagGroups, {
        'x-tagGroups': [
          {
            name: 'Core',
            tags: [123, 'users'],
          },
        ],
      }),
    ).toEqual({
      'x-tagGroups': [
        {
          name: 'Core',
          tags: ['', 'users'],
        },
      ],
    })
  })
})
