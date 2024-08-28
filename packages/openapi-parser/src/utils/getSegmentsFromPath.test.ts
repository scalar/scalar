import { describe, expect, it } from 'vitest'

import { getSegmentsFromPath } from './getSegmentsFromPath'

describe('getSegmentsFromPath', () => {
  it('returns path segments', () => {
    const result = getSegmentsFromPath('/paths/test')

    expect(result).toEqual(['paths', 'test'])
  })

  it('unsescapes slashes', () => {
    const result = getSegmentsFromPath('/paths/~1test')

    expect(result).toEqual(['paths', '/test'])
  })
})
