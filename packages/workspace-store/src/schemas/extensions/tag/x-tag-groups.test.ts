import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XTagGroupsSchema } from './x-tag-groups'

describe('XTagGroupsSchema', () => {
  it('accepts valid tag groups array', () => {
    const result = Value.Parse(XTagGroupsSchema, {
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
    })
    expect(result).toEqual({
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
    })
  })

  it('accepts empty array', () => {
    const result = Value.Parse(XTagGroupsSchema, {
      'x-tagGroups': [],
    })
    expect(result).toEqual({
      'x-tagGroups': [],
    })
  })

  it('throws when groups have no name', () => {
    expect(() =>
      Value.Parse(XTagGroupsSchema, [
        {
          // missing name
          tags: ['users'],
        },
      ]),
    ).toThrow()
  })

  it('ensures tags is an array of strings', () => {
    const result = Value.Parse(XTagGroupsSchema, {
      'x-tagGroups': [
        {
          name: 'Core',
          // invalid: number in tags array
          tags: [123, 'users'],
        },
      ],
    })

    expect(result).toEqual({
      'x-tagGroups': [
        {
          name: 'Core',
          tags: ['123', 'users'],
        },
      ],
    })
  })
})
