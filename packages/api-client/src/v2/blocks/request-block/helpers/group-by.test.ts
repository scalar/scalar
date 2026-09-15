import { describe, expect, expectTypeOf, it } from 'vitest'

import { groupBy } from '@/v2/blocks/request-block/helpers/group-by'

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
  it('keeps missing groups optional and preserves transformed values', () => {
    const input: { kind: 'a' | 'b'; value: number }[] = [{ kind: 'a', value: 1 }]
    const result = groupBy(input, 'kind', (item) => item.value)
    expectTypeOf(result).toEqualTypeOf<Partial<Record<'a' | 'b', number[]>>>()
    expect(result).toEqual({ a: [1] })
    expect(result.b).toBeUndefined()
    expectTypeOf(groupBy(input, 'kind')).toEqualTypeOf<Partial<Record<'a' | 'b', (typeof input)[number][]>>>()
  })

  it('treats inherited property names as ordinary group keys', () => {
    const input = [{ kind: '__proto__' }, { kind: 'constructor' }]
    const result = groupBy(input, 'kind')
    expect(Object.keys(result)).toStrictEqual(['__proto__', 'constructor'])
    expect(result.__proto__).toStrictEqual([input[0]])
    expect(Object.getPrototypeOf(result)).toBeNull()
    expect(groupBy([], 'kind').constructor).toBeUndefined()
  })
})
