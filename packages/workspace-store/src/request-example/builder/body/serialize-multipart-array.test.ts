import { describe, expect, it } from 'vitest'

import { serializeMultipartArray } from './serialize-multipart-array'

describe('serializeMultipartArray', () => {
  it('repeats the name for primitive items without dropping false or zero', () => {
    expect(serializeMultipartArray('values', ['first', '', 0, false])).toEqual([
      { key: 'values', value: 'first' },
      { key: 'values', value: '' },
      { key: 'values', value: '0' },
      { key: 'values', value: 'false' },
    ])
  })

  it('serializes each object and nested array as its own JSON part', () => {
    expect(serializeMultipartArray('values', [{ id: 1 }, { id: 2 }, ['a', 'b'], []])).toEqual([
      { key: 'values', value: '{"id":1}', contentType: 'application/json' },
      { key: 'values', value: '{"id":2}', contentType: 'application/json' },
      { key: 'values', value: '["a","b"]', contentType: 'application/json' },
      { key: 'values', value: '[]', contentType: 'application/json' },
    ])
  })

  it('omits empty arrays and leaves non-array properties to the caller', () => {
    expect(serializeMultipartArray('items', [])).toEqual([])
    expect(serializeMultipartArray('items', '[]')).toBeNull()
    expect(serializeMultipartArray('items', { id: 1 })).toBeNull()
  })

  it('applies explicit content types to every item', () => {
    expect(
      serializeMultipartArray('values', [{ id: 1 }, { id: 2 }], { contentType: 'application/vnd.example+json' }),
    ).toEqual([
      { key: 'values', value: '{"id":1}', contentType: 'application/vnd.example+json' },
      { key: 'values', value: '{"id":2}', contentType: 'application/vnd.example+json' },
    ])
  })

  it('applies style to each array item and ignores contentType when style is explicit', () => {
    expect(
      serializeMultipartArray('values', [{ id: 1 }, { id: 2 }], {
        style: 'form',
        explode: false,
        contentType: 'application/json',
      }),
    ).toEqual([
      { key: 'values', value: 'id,1' },
      { key: 'values', value: 'id,2' },
    ])
  })

  it('keeps primitive array items separate even with explode false', () => {
    expect(serializeMultipartArray('values', ['a', 'b'], { style: 'form', explode: false })).toEqual([
      { key: 'values', value: 'a' },
      { key: 'values', value: 'b' },
    ])
  })

  it('preserves files and applies a per-item content type override', () => {
    const first = new File(['one'], 'one.txt')
    const second = new File(['two'], 'two.txt')
    expect(serializeMultipartArray('files', [first, second], { contentType: 'text/plain' })).toEqual([
      { key: 'files', value: first, contentType: 'text/plain' },
      { key: 'files', value: second, contentType: 'text/plain' },
    ])
  })
  it.each(['application/json', 'application/vnd.example+json; charset=utf-8'])(
    'JSON-encodes string items for %s',
    (contentType) => {
      expect(serializeMultipartArray('tags', ['first', 'a"b', false, 0, null], { contentType })).toEqual([
        { key: 'tags', value: '"first"', contentType },
        { key: 'tags', value: JSON.stringify('a"b'), contentType },
        { key: 'tags', value: 'false', contentType },
        { key: 'tags', value: '0', contentType },
        { key: 'tags', value: 'null', contentType },
      ])
    },
  )
})
