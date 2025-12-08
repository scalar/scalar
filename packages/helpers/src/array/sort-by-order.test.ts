import { describe, expect, it } from 'vitest'

import { sortByOrder } from './sort-by-order'

describe('sort-by-order', () => {
  it('sorts an array of objects by the specified order', () => {
    const items = [
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Bravo' },
      { id: 'c', name: 'Charlie' },
    ]
    const order = ['c', 'a']

    const result = sortByOrder(items, order, (item) => item.id)

    expect(result).toEqual([
      { id: 'c', name: 'Charlie' },
      { id: 'a', name: 'Alpha' },
      { id: 'b', name: 'Bravo' },
    ])
  })

  it('sorts an array of primitive values', () => {
    const input = ['a', 'b', 'c', 'd']
    const order = ['c', 'a']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual(['c', 'a', 'b', 'd'])
  })

  it('returns an empty array when input is empty', () => {
    const result = sortByOrder([], ['a', 'b'], (item: string) => item)

    expect(result).toEqual([])
  })

  it('preserves original order when order array is empty', () => {
    const input = ['a', 'b', 'c']

    const result = sortByOrder(input, [], (item) => item)

    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('sorts all items when all are in the order array', () => {
    const input = ['a', 'b', 'c']
    const order = ['c', 'b', 'a']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual(['c', 'b', 'a'])
  })

  it('ignores order values that do not exist in the input array', () => {
    const input = ['a', 'b']
    const order = ['x', 'a', 'y', 'b', 'z']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual(['a', 'b'])
  })

  it('handles single element arrays', () => {
    const input = ['a']
    const order = ['a']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual(['a'])
  })

  it('handles single element not in order', () => {
    const input = ['a']
    const order = ['b']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual(['a'])
  })

  it('works with numeric identifiers', () => {
    const items = [
      { id: 1, value: 'one' },
      { id: 2, value: 'two' },
      { id: 3, value: 'three' },
    ]
    const order = [3, 1]

    const result = sortByOrder(items, order, (item) => item.id)

    expect(result).toEqual([
      { id: 3, value: 'three' },
      { id: 1, value: 'one' },
      { id: 2, value: 'two' },
    ])
  })

  it('does not mutate the order array', () => {
    const input = ['a', 'b', 'c']
    const order = ['c', 'a']
    const orderCopy = [...order]

    sortByOrder(input, order, (item) => item)

    expect(order).toEqual(orderCopy)
  })

  // TODO: might change this behavior in the future?
  it('handles duplicate values in input array correctly', () => {
    const input = ['a', 'b', 'a', 'c']
    const order = ['c', 'a']

    const result = sortByOrder(input, order, (item) => item)

    // When duplicates exist, the last occurrence takes the sorted position
    // and earlier duplicates are effectively lost (overwritten)
    expect(result).toEqual(['c', 'a', 'b'])
  })

  it('preserves relative order of unmatched items', () => {
    const input = ['x', 'y', 'a', 'z', 'b']
    const order = ['a', 'b']

    const result = sortByOrder(input, order, (item) => item)

    // Ordered items first, then unmatched items in original order
    expect(result).toEqual(['a', 'b', 'x', 'y', 'z'])
  })

  it('works with complex nested objects', () => {
    const items = [
      { meta: { uid: 'first' }, data: 1 },
      { meta: { uid: 'second' }, data: 2 },
      { meta: { uid: 'third' }, data: 3 },
    ]
    const order = ['third', 'first']

    const result = sortByOrder(items, order, (item) => item.meta.uid)

    expect(result).toEqual([
      { meta: { uid: 'third' }, data: 3 },
      { meta: { uid: 'first' }, data: 1 },
      { meta: { uid: 'second' }, data: 2 },
    ])
  })

  it('returns a new array instance', () => {
    const input = ['a', 'b', 'c']
    const order = ['c', 'a']

    const result = sortByOrder(input, order, (item) => item)

    expect(result).not.toBe(input)
  })

  it('handles falsy values in input array #1', () => {
    const input = [5, 0, 10, 6]
    const order = [10, 5]

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual([10, 5, 0, 6])
  })

  it('handles falsy values in input array #2', () => {
    const input = [5, 0, 10, 6]
    const order = [10, 0, 5]

    const result = sortByOrder(input, order, (item) => item)

    expect(result).toEqual([10, 0, 5, 6])
  })
})
