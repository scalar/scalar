import { describe, expect, it } from 'vitest'
import { XTagGroupsSchema } from './x-tag-groups'
import { Value } from '@sinclair/typebox/value'

describe('XTagGroupsSchema', () => {
  it('accepts valid tag groups array', () => {
    const result = Value.Parse(XTagGroupsSchema, [
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
    const result = Value.Parse(XTagGroupsSchema, [])
    expect(result).toEqual([])
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
    const result = Value.Parse(XTagGroupsSchema, [
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
