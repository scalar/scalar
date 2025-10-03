import { describe, expect, it } from 'vitest'

import { groupBy } from '@/v2/blocks/scalar-operation-block/helpers/group-by'

describe('groupBy', () => {
  it('groups array elements by a common key', () => {
    const input = [
      {
        discriminator: 'a',
        value: 1,
      },
      {
        discriminator: 'a',
        value: 2,
      },
      {
        discriminator: 'a',
        value: 3,
      },
      {
        discriminator: 'a',
        value: 4,
      },
      {
        discriminator: 'b',
        value: 5,
      },
      {
        discriminator: 'b',
        value: 6,
      },
      {
        discriminator: 'c',
        value: 7,
      },
      {
        discriminator: 'c',
        value: 8,
      },
    ]

    expect(groupBy(input, 'discriminator')).toEqual({
      a: [
        {
          discriminator: 'a',
          value: 1,
        },
        {
          discriminator: 'a',
          value: 2,
        },
        {
          discriminator: 'a',
          value: 3,
        },
        {
          discriminator: 'a',
          value: 4,
        },
      ],
      b: [
        {
          discriminator: 'b',
          value: 5,
        },
        {
          discriminator: 'b',
          value: 6,
        },
      ],
      c: [
        {
          discriminator: 'c',
          value: 7,
        },
        {
          discriminator: 'c',
          value: 8,
        },
      ],
    })
  })
})
