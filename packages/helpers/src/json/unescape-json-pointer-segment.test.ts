import { describe, expect, it } from 'vitest'

import { escapeJsonPointer } from './escape-json-pointer'
import { unescapeJsonPointerSegment } from './unescape-json-pointer-segment'

describe('unescape-json-pointer-segment', () => {
  it.each([
    ['foo~1bar~1baz', 'foo/bar/baz'],
    ['foo~0bar~0baz', 'foo~bar~baz'],
    ['foo~1bar~0baz', 'foo/bar~baz'],
    ['~01', '~1'],
    ['~00', '~0'],
  ])('unescapes %s to %s', (segment, expected) => {
    expect(unescapeJsonPointerSegment(segment)).toBe(expected)
  })

  it.each(['', 'get', 'CUSTOM%', 'CUSTOM%20METHOD', '%2F', '%7E1', '%FF', 'café'])(
    'preserves the literal key %j',
    (segment) => {
      expect(unescapeJsonPointerSegment(segment)).toBe(segment)
    },
  )

  it('unescapes pointer sequences without decoding percent sequences', () => {
    expect(unescapeJsonPointerSegment('~1files%20new~1~0draft%')).toBe('/files%20new/~draft%')
  })

  it.each(['', '/files%20new', 'CUSTOM%', '~1/~0', 'café/日本語'])('round-trips the key %j', (key) => {
    expect(unescapeJsonPointerSegment(escapeJsonPointer(key))).toBe(key)
  })
})
