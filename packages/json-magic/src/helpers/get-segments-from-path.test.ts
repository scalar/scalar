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
})
