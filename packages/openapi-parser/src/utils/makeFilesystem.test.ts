import { describe, expect, it } from 'vitest'

import { isFilesystem } from './isFilesystem'
import { makeFilesystem } from './makeFilesystem'

describe('isFilesystem', () => {
  it('transforms an object to a filesystem', () => {
    const result = makeFilesystem({
      foo: 'bar',
    })

    expect(result).not.toBe({
      foo: 'bar',
    })

    expect(isFilesystem(result)).toBe(true)
  })
})
