import { clone } from '@/clone'
import { describe, expect, test } from 'vitest'

import { setNestedValue } from './nested'

const nestedObj = {
  a: {
    aa: 10,
    ab: 'string',
  },
  b: 'my var',
  c: [{ name: 'one' }, { name: 'two' }],
  d: {
    da: {
      daa: {
        daaa: 10,
        daab: 11,
      },
    },
  },
}

describe('Set a nested value', () => {
  test('Basic nested set', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(copy, 'a.ab', 'some string')

    baseObj.a.ab = 'some string'
    expect(copy).toEqual(baseObj)
    expect(copy.a.ab).toEqual('some string')
  })

  test('Nested array replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.1.name', 'three')
    copy.c[1].name = 'three'

    expect(baseObj).toEqual(copy)
  })

  test('Object replacement', () => {
    const baseObj = clone(nestedObj)
    const copy = clone(nestedObj)

    setNestedValue(baseObj, 'c.2', { name: 'asda' })
    copy.c[2] = { name: 'asda' }

    expect(baseObj).toEqual(copy)
  })
})
