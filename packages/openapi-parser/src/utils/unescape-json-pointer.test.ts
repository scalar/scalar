import { describe, expect, it } from 'vitest'

import { unescapeJsonPointer } from './unescape-json-pointer'

describe('unescapeJsonPointer', async () => {
  it('unescapes a slash', () => {
    expect(unescapeJsonPointer('/foo~1bar~1baz')).toBe('/foo/bar/baz')
  })

  it('unescapes multiple slashes', () => {
    expect(unescapeJsonPointer('#/paths/~1upload/post/responses/401/content/application~1problem+json/schema')).toBe(
      '#/paths//upload/post/responses/401/content/application/problem+json/schema',
    )
  })

  it('unescapes a tilde', () => {
    expect(unescapeJsonPointer('/foo~0bar~0baz')).toBe('/foo~bar~baz')
  })

  it('unescapes a space', () => {
    expect(unescapeJsonPointer('foo%20bar')).toBe('foo bar')
  })
})
