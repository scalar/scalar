import { describe, expect, it } from 'vitest'

import { parseJsonPointerSegments } from './parse-json-pointer-segments'

describe('parse-json-pointer-segments', () => {
  it('returns path segments', () => {
    const result = parseJsonPointerSegments('/paths/test')

    expect(result).toEqual(['paths', 'test'])
  })

  it('unescapes slashes', () => {
    const result = parseJsonPointerSegments('/paths/~1test')

    expect(result).toEqual(['paths', '/test'])
  })

  it('unescapes tildes', () => {
    const result = parseJsonPointerSegments('/components/schemas/foo~0bar')

    expect(result).toEqual(['components', 'schemas', 'foo~bar'])
  })
})
