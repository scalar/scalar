import { describe, expect, it } from 'vitest'

import { objectFromArray } from './object-from-array'

describe('Converts an array of objects into a hash map', () => {
  it('Handles basic maps', () => {
    const arr = [
      { key: '1', name: 'one' },
      { key: '2', name: 'two' },
    ]
    expect(objectFromArray(arr, (item) => item.key)).toEqual({
      '1': { key: '1', name: 'one' },
      '2': { key: '2', name: 'two' },
    })
  })

  it('Handles key transforms', () => {
    const arr = [
      { key: '1', name: 'one', animal: 'Cow' },
      { key: '2', name: 'two', animal: 'Chicken' },
      { key: '3', name: 'three', animal: 'Sheep' },
    ]

    expect(objectFromArray(arr, (item) => `${item.key}-${item.animal.toUpperCase()}`)).toEqual({
      '1-COW': { key: '1', name: 'one', animal: 'Cow' },
      '2-CHICKEN': { key: '2', name: 'two', animal: 'Chicken' },
      '3-SHEEP': { key: '3', name: 'three', animal: 'Sheep' },
    })
  })
})
