import { describe, expect, it } from 'vitest'
import { XTagGroupsSchema } from './x-tag-groups'

describe('XTagGroupsSchema', () => {
  it('accepts valid tag groups array', () => {
    const result = XTagGroupsSchema.parse([
      {
        name: 'Core',
        tags: ['users', 'auth'],
      },
      {
        name: 'Products',
        tags: ['inventory', 'orders'],
      },
    ])
    expect(result).toEqual([
      {
        name: 'Core',
        tags: ['users', 'auth'],
      },
      {
        name: 'Products',
        tags: ['inventory', 'orders'],
      },
    ])
  })

  it('accepts empty array', () => {
    const result = XTagGroupsSchema.parse([])
    expect(result).toEqual([])
  })

  it('validates tag group structure', () => {
    expect(() =>
      XTagGroupsSchema.parse([
        {
          // missing name
          tags: ['users'],
        },
      ]),
    ).toThrow()
  })

  it('ensures tags is an array of strings', () => {
    expect(() =>
      XTagGroupsSchema.parse([
        {
          name: 'Core',
          tags: [123, 'users'], // invalid: number in tags array
        },
      ]),
    ).toThrow()
  })
})
