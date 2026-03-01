import { describe, expect, it } from 'vitest'

import { unescapeJsonPointer } from './unescape-json-pointer'

describe('unescape-json-pointer', () => {
  it('unescapes forward slashes', () => {
    expect(unescapeJsonPointer('/foo~1bar~1baz')).toBe('/foo/bar/baz')
  })

  it('unescapes tildes', () => {
    expect(unescapeJsonPointer('/foo~0bar~0baz')).toBe('/foo~bar~baz')
  })

  it('handles mixed escaped values', () => {
    expect(unescapeJsonPointer('#/paths/~1upload/post/content/application~1problem+json')).toBe(
      '#/paths//upload/post/content/application/problem+json',
    )
  })

  it('decodes URI-encoded values', () => {
    expect(unescapeJsonPointer('foo%20bar')).toBe('foo bar')
  })
})
