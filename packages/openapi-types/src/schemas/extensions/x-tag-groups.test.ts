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

  it('removes groups without name', () => {
    const result = XTagGroupsSchema.parse([
      {
        // missing name
        tags: ['users'],
      },
    ])

    expect(result).toEqual([])
  })

  it('ensures tags is an array of strings', () => {
    const result = XTagGroupsSchema.parse([
      {
        name: 'Core',
        // invalid: number in tags array
        tags: [123, 'users'],
      },
    ])

    expect(result).toEqual([
      {
        name: 'Core',
        tags: ['123', 'users'],
      },
    ])
  })
})
