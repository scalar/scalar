import { describe, expect, it } from 'vitest'

import { addToMapArray } from './add-to-map-array'

describe('addToMapArray', () => {
  it('adds a value to a new key in an empty map', () => {
    const map = new Map<string, unknown[]>()
    addToMapArray(map, 'key1', 'value1')

    expect(map.get('key1')).toEqual(['value1'])
  })

  it('appends a value to an existing key with values', () => {
    const map = new Map<string, unknown[]>()
    map.set('key1', ['value1', 'value2'])

    addToMapArray(map, 'key1', 'value3')

    expect(map.get('key1')).toEqual(['value1', 'value2', 'value3'])
  })

  it('preserves existing values when adding to different keys', () => {
    const map = new Map<string, unknown[]>()
    addToMapArray(map, 'key1', 'value1')
    addToMapArray(map, 'key2', 'value2')
    addToMapArray(map, 'key1', 'value3')

    expect(map.get('key1')).toEqual(['value1', 'value3'])
    expect(map.get('key2')).toEqual(['value2'])
  })

  it('handles various value types including null and undefined', () => {
    const map = new Map<string, unknown[]>()

    addToMapArray(map, 'mixed', 42)
    addToMapArray(map, 'mixed', 'string')
    addToMapArray(map, 'mixed', null)
    addToMapArray(map, 'mixed', undefined)
    addToMapArray(map, 'mixed', { foo: 'bar' })
    addToMapArray(map, 'mixed', [1, 2, 3])

    expect(map.get('mixed')).toEqual([42, 'string', null, undefined, { foo: 'bar' }, [1, 2, 3]])
  })
})
