import { describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from './get-segments-from-path'

describe('getSegmentsFromPath', () => {
  it('returns path segments', () => {
    const result = getSegmentsFromPath('/paths/test')

    expect(result).toEqual(['paths', 'test'])
  })

  it('unescaped slashes', () => {
    const result = getSegmentsFromPath('/paths/~1test')

    expect(result).toEqual(['paths', '/test'])
  })

  it('decodes a percent-encoded hash from a URI fragment', () => {
    const result = getSegmentsFromPath('/paths/~1items%23list')

    expect(result).toEqual(['paths', '/items#list'])
  })
})
